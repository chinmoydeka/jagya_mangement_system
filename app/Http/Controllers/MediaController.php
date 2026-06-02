<?php

namespace App\Http\Controllers;

use App\Models\MediaFolder;
use App\Models\MediaFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;

class MediaController extends Controller
{
    public function index(Request $request)
    {
        $folderId = $request->get('folder_id');
        $type = $request->get('type');
        $search = $request->get('search');

        // Current folder details
        $currentFolder = null;
        if ($folderId) {
            $currentFolder = MediaFolder::with('parent')->findOrFail($folderId);
        }

        // Build breadcrumbs
        $breadcrumbs = [];
        if ($folderId) {
            $curr = $currentFolder;
            while ($curr) {
                array_unshift($breadcrumbs, [
                    'id' => $curr->id,
                    'name' => $curr->name,
                ]);
                $curr = $curr->parent;
            }
        }

        // Fetch folders
        $foldersQuery = MediaFolder::orderBy('name');
        if ($search) {
            // Global search
            $folders = $foldersQuery->where('name', 'like', "%{$search}%")->get();
        } else {
            // Nested list
            $folders = $foldersQuery->where('parent_id', $folderId)->get();
        }

        // Fetch files
        $filesQuery = MediaFile::orderByDesc('created_at');
        if ($search) {
            // Global search
            $filesQuery->where('name', 'like', "%{$search}%");
        } else {
            // Nested list
            $filesQuery->where('folder_id', $folderId);
        }

        if ($type) {
            $filesQuery->where('file_type', $type);
        }

        $files = $filesQuery->get()->map(fn($f) => [
            'id' => $f->id,
            'name' => $f->name,
            'original_name' => $f->original_name,
            'file_path' => $f->file_path,
            'mime_type' => $f->mime_type,
            'file_type' => $f->file_type,
            'file_size' => $f->file_size,
            'folder_id' => $f->folder_id,
            'created_at' => $f->created_at->format('d M Y H:i'),
        ]);

        $data = [
            'folders' => $folders,
            'files' => $files,
            'breadcrumbs' => $breadcrumbs,
            'current_folder_id' => $folderId ? (int)$folderId : null,
            'current_folder_name' => $currentFolder ? $currentFolder->name : 'Root',
            'filters' => [
                'type' => $type,
                'search' => $search,
            ]
        ];

        if ($request->wantsJson()) {
            return response()->json($data);
        }

        return Inertia::render('FileManager', $data);
    }

    public function createFolder(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:media_folders,id',
        ]);

        $folder = MediaFolder::create([
            'name' => $validated['name'],
            'parent_id' => $validated['parent_id'],
            'created_by' => Auth::id(),
        ]);

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'folder' => $folder]);
        }

        return back()->with('success', "Folder '{$folder->name}' created.");
    }

    public function upload(Request $request)
    {
        $request->validate([
            'files' => 'required|array',
            'files.*' => 'required|file|max:51200', // 50MB limit
            'folder_id' => 'nullable|exists:media_folders,id',
        ]);

        $uploadedFiles = [];

        if ($request->hasFile('files')) {
            // Ensure media directory exists
            if (!file_exists(public_path('uploads/media'))) {
                mkdir(public_path('uploads/media'), 0755, true);
            }

            foreach ($request->file('files') as $file) {
                $originalName = $file->getClientOriginalName();
                $extension = $file->getClientOriginalExtension();
                
                // Safe name
                $safeName = Str::slug(pathinfo($originalName, PATHINFO_FILENAME));
                $filename = time() . '_' . rand(100, 999) . '_' . $safeName . '.' . $extension;
                
                $fileSize = $file->getSize();
                $mimeType = $file->getClientMimeType();
                
                // Move file
                $file->move(public_path('uploads/media'), $filename);
                $filePath = '/uploads/media/' . $filename;
                
                // Determine file type category
                $fileType = 'other';
                if (Str::startsWith($mimeType, 'image/')) {
                    $fileType = 'image';
                } elseif ($mimeType === 'application/pdf') {
                    $fileType = 'pdf';
                } elseif (in_array($mimeType, [
                    'application/vnd.ms-excel',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'text/csv'
                ]) || in_array($extension, ['csv', 'xls', 'xlsx'])) {
                    $fileType = 'spreadsheet';
                } elseif (in_array($mimeType, [
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'text/plain',
                    'application/rtf'
                ]) || in_array($extension, ['doc', 'docx', 'txt', 'rtf'])) {
                    $fileType = 'document';
                } elseif (Str::startsWith($mimeType, 'audio/')) {
                    $fileType = 'audio';
                } elseif (in_array($mimeType, [
                    'application/zip',
                    'application/x-rar-compressed',
                    'application/x-tar',
                    'application/x-7z-compressed'
                ]) || in_array($extension, ['zip', 'rar', '7z', 'tar', 'gz'])) {
                    $fileType = 'archive';
                }

                $mediaFile = MediaFile::create([
                    'name' => $originalName,
                    'original_name' => $originalName,
                    'file_path' => $filePath,
                    'mime_type' => $mimeType,
                    'file_type' => $fileType,
                    'file_size' => $fileSize,
                    'folder_id' => $request->input('folder_id'),
                    'uploaded_by' => Auth::id(),
                ]);

                $uploadedFiles[] = $mediaFile;
            }
        }

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'files' => $uploadedFiles]);
        }

        return back()->with('success', count($uploadedFiles) . ' file(s) uploaded successfully.');
    }

    public function renameFile(Request $request, MediaFile $file)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        // Retain original extension if not provided
        $newName = $validated['name'];
        $originalExt = pathinfo($file->name, PATHINFO_EXTENSION);
        $newExt = pathinfo($newName, PATHINFO_EXTENSION);
        
        if (empty($newExt) && !empty($originalExt)) {
            $newName .= '.' . $originalExt;
        }

        $file->update(['name' => $newName]);

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'file' => $file]);
        }

        return back()->with('success', 'File renamed.');
    }

    public function renameFolder(Request $request, MediaFolder $folder)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $folder->update(['name' => $validated['name']]);

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'folder' => $folder]);
        }

        return back()->with('success', 'Folder renamed.');
    }

    public function destroyFile(Request $request, MediaFile $file)
    {
        // Delete physical file
        if (file_exists(public_path($file->file_path))) {
            @unlink(public_path($file->file_path));
        }

        $file->delete();

        if ($request->wantsJson()) {
            return response()->json(['success' => true]);
        }

        return back()->with('success', 'File deleted successfully.');
    }

    public function destroyFolder(Request $request, MediaFolder $folder)
    {
        // Recursively delete physical files in subfolders
        $this->deleteFolderFiles($folder);

        $folder->delete(); // Database cascade deletes subfolders and media files reference

        if ($request->wantsJson()) {
            return response()->json(['success' => true]);
        }

        return back()->with('success', 'Folder deleted successfully.');
    }

    protected function deleteFolderFiles(MediaFolder $folder)
    {
        // Delete files in this folder
        foreach ($folder->files as $file) {
            if (file_exists(public_path($file->file_path))) {
                @unlink(public_path($file->file_path));
            }
        }

        // Recursively clean up subfolders
        foreach ($folder->children as $child) {
            $this->deleteFolderFiles($child);
        }
    }
}

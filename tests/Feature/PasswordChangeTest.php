<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PasswordChangeTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_change_password_with_correct_current_password(): void
    {
        $user = User::factory()->create([
            'password' => 'old-password', // hashed cast handles hashing
        ]);

        $response = $this->actingAs($user)->postJson('/settings/change-password', [
            'current_password' => 'old-password',
            'new_password' => 'new-password-123',
            'new_password_confirmation' => 'new-password-123',
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
        ]);

        $this->assertTrue(Hash::check('new-password-123', $user->fresh()->password));
    }

    public function test_user_cannot_change_password_with_incorrect_current_password(): void
    {
        $user = User::factory()->create([
            'password' => 'old-password', // hashed cast handles hashing
        ]);

        $response = $this->actingAs($user)->postJson('/settings/change-password', [
            'current_password' => 'wrong-current-password',
            'new_password' => 'new-password-123',
            'new_password_confirmation' => 'new-password-123',
        ]);

        $response->assertStatus(422);
        $response->assertJson([
            'success' => false,
            'message' => 'The provided current password does not match our records.',
        ]);

        $this->assertFalse(Hash::check('new-password-123', $user->fresh()->password));
    }
}

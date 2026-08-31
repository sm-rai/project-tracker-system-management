<?php

use App\Models\User;

function mcpInitializePayload(): array
{
    return [
        'jsonrpc' => '2.0',
        'id' => 1,
        'method' => 'initialize',
        'params' => [
            'protocolVersion' => '2025-11-25',
            'capabilities' => (object) [],
            'clientInfo' => [
                'name' => 'Codex',
                'version' => '1.0.0',
            ],
        ],
    ];
}

test('the remote project tracker MCP requires authentication', function (): void {
    $this->postJson('/mcp/project-tracker', mcpInitializePayload())
        ->assertUnauthorized();
});

test('the production MCP endpoint requires explicit trusted proxy configuration', function (): void {
    $originalEnvironment = app()->environment();
    app()->detectEnvironment(fn (): string => 'production');
    config()->set('trustedproxy.proxies');

    try {
        $this->postJson('/mcp/project-tracker', mcpInitializePayload())
            ->assertServiceUnavailable();
    } finally {
        app()->detectEnvironment(fn (): string => $originalEnvironment);
    }
});

test('an MCP token with the required ability may initialize the remote server', function (): void {
    $user = User::factory()->create();
    $token = $user->createToken('Codex MCP', ['mcp:use'])->plainTextToken;

    $this->withToken($token)
        ->postJson('/mcp/project-tracker', mcpInitializePayload())
        ->assertSuccessful()
        ->assertJsonPath('result.serverInfo.name', 'Project Tracker');
});

test('an MCP token without the required ability is forbidden', function (): void {
    $user = User::factory()->create();
    $token = $user->createToken('Codex MCP', [])->plainTextToken;

    $this->withToken($token)
        ->postJson('/mcp/project-tracker', mcpInitializePayload())
        ->assertForbidden();
});

test('the remote project tracker MCP uses the dedicated rate limiter', function (): void {
    $route = collect(app('router')->getRoutes()->getRoutes())
        ->first(fn ($route): bool => $route->uri() === 'mcp/project-tracker' && in_array('POST', $route->methods(), true));

    expect($route)->not->toBeNull()
        ->and($route->gatherMiddleware())->toContain('throttle:project-tracker-mcp');
});

test('unauthenticated MCP requests are rate limited before token lookup', function (): void {
    foreach (range(1, 60) as $attempt) {
        $this->withHeader('X-Forwarded-For', "203.0.113.{$attempt}")
            ->postJson('/mcp/project-tracker', mcpInitializePayload())
            ->assertUnauthorized();
    }

    $this->withHeader('X-Forwarded-For', '198.51.100.1')
        ->postJson('/mcp/project-tracker', mcpInitializePayload())
        ->assertTooManyRequests();
});

test('trusted proxy client addresses receive separate pre-auth rate limits', function (): void {
    config()->set('trustedproxy.proxies', '127.0.0.1');

    foreach (range(1, 60) as $attempt) {
        $this->withHeader('X-Forwarded-For', '203.0.113.10')
            ->postJson('/mcp/project-tracker', mcpInitializePayload())
            ->assertUnauthorized();
    }

    $this->withHeader('X-Forwarded-For', '203.0.113.10')
        ->postJson('/mcp/project-tracker', mcpInitializePayload())
        ->assertTooManyRequests();

    $this->withHeader('X-Forwarded-For', '203.0.113.11')
        ->postJson('/mcp/project-tracker', mcpInitializePayload())
        ->assertUnauthorized();
});

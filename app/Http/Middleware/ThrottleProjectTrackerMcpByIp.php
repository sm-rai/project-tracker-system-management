<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

final class ThrottleProjectTrackerMcpByIp
{
    private const DECAY_SECONDS = 60;

    private const MAX_ATTEMPTS = 60;

    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (app()->isProduction() && blank(config('trustedproxy.proxies'))) {
            return response()->json([
                'message' => 'Project Tracker MCP is unavailable until trusted proxies are configured.',
            ], Response::HTTP_SERVICE_UNAVAILABLE);
        }

        $key = 'project-tracker-mcp:ip:'.hash('sha256', $request->ip());

        if (RateLimiter::tooManyAttempts($key, self::MAX_ATTEMPTS)) {
            $retryAfter = RateLimiter::availableIn($key);

            return response()->json([
                'message' => 'Too Many Requests.',
            ], Response::HTTP_TOO_MANY_REQUESTS, [
                'Retry-After' => (string) $retryAfter,
                'X-RateLimit-Limit' => (string) self::MAX_ATTEMPTS,
                'X-RateLimit-Remaining' => '0',
            ]);
        }

        RateLimiter::hit($key, self::DECAY_SECONDS);

        $response = $next($request);
        $response->headers->set('X-RateLimit-Limit', (string) self::MAX_ATTEMPTS);
        $response->headers->set(
            'X-RateLimit-Remaining',
            (string) RateLimiter::remaining($key, self::MAX_ATTEMPTS),
        );

        return $response;
    }
}

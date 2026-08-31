<?php

namespace App\Mcp\Support;

final class GithubImportSource
{
    private const MARKER_PREFIX = 'Sumber GitHub: ';

    public static function canonicalUrl(string $url): ?string
    {
        $parts = parse_url(trim($url));

        if (
            $parts === false
            || strtolower((string) ($parts['scheme'] ?? '')) !== 'https'
            || strtolower((string) ($parts['host'] ?? '')) !== 'github.com'
        ) {
            return null;
        }

        $segments = explode('/', trim((string) ($parts['path'] ?? ''), '/'));

        if (count($segments) !== 4) {
            return null;
        }

        [$owner, $repository, $resourceType, $resourceId] = $segments;
        $resourceType = strtolower($resourceType);

        if (
            preg_match('/^[a-z0-9](?:[a-z0-9-]{0,38})$/i', $owner) !== 1
            || preg_match('/^[a-z0-9._-]+$/i', $repository) !== 1
        ) {
            return null;
        }

        $isNumberedResource = in_array($resourceType, ['issues', 'pull'], true)
            && ctype_digit($resourceId)
            && (int) $resourceId > 0;
        $isCommit = $resourceType === 'commit'
            && preg_match('/^[a-f0-9]{7,40}$/i', $resourceId) === 1;

        if (! $isNumberedResource && ! $isCommit) {
            return null;
        }

        $canonicalId = $isNumberedResource
            ? (string) ((int) $resourceId)
            : strtolower($resourceId);

        return sprintf(
            'https://github.com/%s/%s/%s/%s',
            strtolower($owner),
            strtolower($repository),
            $resourceType,
            $canonicalId,
        );
    }

    public static function marker(string $canonicalUrl): string
    {
        return self::MARKER_PREFIX.$canonicalUrl;
    }

    public static function appendToDescription(string $description, string $canonicalUrl): string
    {
        return trim($description)."\n\n".self::marker($canonicalUrl);
    }

    public static function descriptionMatches(string $description, string $canonicalUrl): bool
    {
        return str_ends_with($description, "\n\n".self::marker($canonicalUrl));
    }

    public static function lockKey(string $canonicalUrl): string
    {
        return 'project-tracker:github-import:'.hash('sha256', $canonicalUrl);
    }
}

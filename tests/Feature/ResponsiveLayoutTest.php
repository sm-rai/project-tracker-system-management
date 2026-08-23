<?php

test('the shared sidebar inset can shrink below its content width', function () {
    $sidebar = file_get_contents(
        base_path('resources/js/components/ui/sidebar.tsx'),
    );

    expect($sidebar)->toContain('min-w-0 w-full flex-1');
});

test('tablet widths use the drawer navigation breakpoint', function () {
    $mobileHook = file_get_contents(
        base_path('resources/js/hooks/use-mobile.ts'),
    );

    expect($mobileHook)->toContain('const MOBILE_BREAKPOINT = 1024');
});

test('project detail keeps its mobile header and tabs within the viewport', function () {
    $projectShow = file_get_contents(
        base_path('resources/js/pages/projects/show.tsx'),
    );

    expect($projectShow)
        ->toContain('min-w-0')
        ->toContain('max-w-full')
        ->toContain('overflow-x-auto')
        ->toContain('min-h-11');
});

test('dense mobile actions use touch-sized controls', function () {
    $issuesIndex = file_get_contents(
        base_path('resources/js/pages/issues/index.tsx'),
    );
    $projectsIndex = file_get_contents(
        base_path('resources/js/pages/projects/index.tsx'),
    );
    $featureRequestsIndex = file_get_contents(
        base_path('resources/js/pages/feature-requests/index.tsx'),
    );
    $siteHeader = file_get_contents(
        base_path('resources/js/components/site-header.tsx'),
    );
    $filterPopover = file_get_contents(
        base_path('resources/js/components/filter-popover.tsx'),
    );
    $usersIndex = file_get_contents(
        base_path('resources/js/pages/users/index.tsx'),
    );
    $issueShow = file_get_contents(
        base_path('resources/js/pages/issues/show.tsx'),
    );
    $featureRequestShow = file_get_contents(
        base_path('resources/js/pages/feature-requests/show.tsx'),
    );

    expect($issuesIndex)
        ->toContain('size-11 text-muted-foreground')
        ->and($projectsIndex)
        ->toContain('size-11 h-11 text-xs font-medium')
        ->and($featureRequestsIndex)
        ->toContain('h-11 gap-1.5')
        ->and($siteHeader)
        ->toContain('size-11 lg:size-7')
        ->and($filterPopover)
        ->toContain('h-11 w-full justify-between gap-2 sm:w-auto lg:h-9')
        ->and($usersIndex)
        ->toContain('size-11 text-muted-foreground')
        ->and($issueShow)
        ->toContain('size-11 lg:size-9')
        ->and($featureRequestShow)
        ->toContain('h-11 lg:h-9');
});

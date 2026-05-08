<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Portal /dashboard/user/* — untuk peran member (dan super-admin bila perlu QA).
 * Akun organizer tanpa peran member diarahkan ke dasbor utama.
 */
class EnsureMemberPortalAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null) {
            return redirect()->guest(route('auth.login'));
        }

        if ($user->can('events.list') && ! $user->hasAnyRole(['member', 'super-admin'])) {
            return redirect()->route('dashboard.home');
        }

        if (! $user->hasAnyRole(['member', 'super-admin'])) {
            abort(403);
        }

        return $next($request);
    }
}

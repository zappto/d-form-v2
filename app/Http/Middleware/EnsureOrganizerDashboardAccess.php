<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Routes khusus penyelenggara event (punya permission events.list).
 * Member murni diarahkan ke portal pengguna.
 */
class EnsureOrganizerDashboardAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null || ! $user->can('events.list')) {
            if ($user !== null && $user->hasRole('member')) {
                return redirect()->route('dashboard.user.events');
            }

            abort(403);
        }

        return $next($request);
    }
}

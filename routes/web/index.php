<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return inertia('Index');
})->name('home');

Route::get('/info', function () {
    die(phpinfo());
})->name('info');

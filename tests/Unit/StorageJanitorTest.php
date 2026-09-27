<?php

namespace Tests\Unit;

use App\Support\StorageJanitor;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class StorageJanitorTest extends TestCase
{
    public function test_delete_public_removes_existing_file(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('forms/banners/old.jpg', 'x');
        StorageJanitor::deletePublic('forms/banners/old.jpg');
        Storage::disk('public')->assertMissing('forms/banners/old.jpg');
    }

    public function test_delete_public_skips_non_paths(): void
    {
        Storage::fake('public');
        StorageJanitor::deletePublic(null);
        StorageJanitor::deletePublic('');
        StorageJanitor::deletePublic('data:image/png;base64,AAA');
        StorageJanitor::deletePublic('https://oauth.example/avatar.jpg');
        StorageJanitor::deletePublic('forms/banners/missing.jpg');
        $this->assertTrue(true); // sukses = tidak throw
    }

    public function test_delete_public_strips_storage_prefix(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('forms/banners/old.jpg', 'x');
        StorageJanitor::deletePublic('/storage/forms/banners/old.jpg');
        Storage::disk('public')->assertMissing('forms/banners/old.jpg');
    }

    public function test_form_answer_paths_collects_uploads_only(): void
    {
        $this->assertSame(
            ['form-uploads/1/abc.jpg'],
            StorageJanitor::formAnswerPaths(['cv' => 'form-uploads/1/abc.jpg', 'nama' => 'Budi', 'kosong' => null]),
        );
    }

    public function test_metadata_image_paths_collects_banner_and_options(): void
    {
        $this->assertSame(
            ['forms/banners/a.jpg', 'forms/options/o.jpg'],
            StorageJanitor::metadataImagePaths([
                'bannerUrl' => 'forms/banners/a.jpg',
                'optionChoices' => [['imageUrl' => 'forms/options/o.jpg'], ['label' => 'x']],
            ]),
        );
        $this->assertSame([], StorageJanitor::metadataImagePaths(null));
    }
}

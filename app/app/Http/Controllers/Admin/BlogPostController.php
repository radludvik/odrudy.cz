<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BlogPostController extends Controller
{
    public function index(Request $request)
    {
        $query = BlogPost::query();
        if ($search = trim((string) $request->input('q'))) {
            $query->where('title', 'like', "%{$search}%");
        }
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }
        $posts = $query->orderByDesc('updated_at')->paginate(30)->withQueryString();
        return view('admin.blog.index', compact('posts'));
    }

    public function create()
    {
        $blogPost = new BlogPost(['status' => 'draft']);
        return view('admin.blog.form', compact('blogPost'));
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $data['hero_image_url'] = $this->handleImage($request, null, $data) ?? null;
        if ($data['status'] === 'published' && empty($data['published_at'])) {
            $data['published_at'] = now();
        }
        $post = BlogPost::create($data);
        return redirect()->route('admin.blog.edit', $post)
            ->with('success', 'Článek „' . $post->title . '" vytvořen.');
    }

    public function edit(BlogPost $blogPost)
    {
        return view('admin.blog.form', compact('blogPost'));
    }

    public function update(Request $request, BlogPost $blogPost)
    {
        $data = $this->validateData($request, $blogPost);
        $newImage = $this->handleImage($request, $blogPost, $data);
        if ($newImage) {
            $data['hero_image_url'] = $newImage;
        }
        if ($data['status'] === 'published' && !$blogPost->published_at) {
            $data['published_at'] = now();
        }
        $blogPost->update($data);
        return redirect()->route('admin.blog.edit', $blogPost)
            ->with('success', 'Článek uložen.');
    }

    public function destroy(BlogPost $blogPost)
    {
        $blogPost->delete();
        return redirect()->route('admin.blog.index')
            ->with('success', 'Článek smazán.');
    }

    private function validateData(Request $request, ?BlogPost $post = null): array
    {
        $rules = [
            'title'            => ['required', 'string', 'max:255'],
            'slug'             => ['required', 'string', 'max:255', 'regex:/^[a-z0-9-]+$/'],
            'excerpt'          => ['nullable', 'string', 'max:500'],
            'content_html'     => ['nullable', 'string'],
            'category'         => ['nullable', 'string', 'max:255'],
            'status'           => ['required', 'in:draft,published'],
            'meta_title'       => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'image'            => ['nullable', 'image', 'mimes:png,jpg,jpeg,webp', 'max:5120'],
        ];
        if ($post) {
            $rules['slug'][] = "unique:blog_posts,slug,{$post->id}";
        } else {
            $rules['slug'][] = 'unique:blog_posts,slug';
        }
        $data = $request->validate($rules);
        unset($data['image']);
        return $data;
    }

    private function handleImage(Request $request, ?BlogPost $post, array $data): ?string
    {
        if (!$request->hasFile('image')) {
            return null;
        }
        $slug = $data['slug'] ?? Str::random(8);
        $file = $request->file('image');
        $ext  = $file->getClientOriginalExtension() ?: 'png';
        $relPath = "/images/blog/{$slug}.{$ext}";
        $absPath = base_path('public' . $relPath);
        if (!is_dir(dirname($absPath))) {
            mkdir(dirname($absPath), 0755, true);
        }
        $file->move(dirname($absPath), basename($absPath));
        return $relPath;
    }
}

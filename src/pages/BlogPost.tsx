import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { blogs } from "@/components/BlogSection";
import { toast } from "sonner";

const BlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  const blog = blogs.find(b => b.slug === slug);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Blog post not found</h1>
          <Button onClick={() => navigate('/')}>Go back home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-[400px] overflow-hidden">
        <img
          src={blog.image}
          alt={blog.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-8 left-8 flex items-center gap-2 text-white hover:text-primary transition-colors bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold">Back to Home</span>
        </button>

        {/* Title and Meta */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="container mx-auto max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-bold mb-4">
              {blog.category}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {blog.title}
            </h1>
            <div className="flex items-center gap-6 text-white/90">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">{blog.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{blog.readTime}</span>
              </div>
              <div className="text-sm">By {blog.author}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <article className="container mx-auto max-w-4xl px-4 py-12">
        {/* Share Button */}
        <div className="flex justify-end mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const shareUrl = window.location.href;
              
              if (navigator.share) {
                try {
                  await navigator.share({
                    title: blog.title,
                    text: blog.excerpt,
                    url: shareUrl,
                  });
                } catch (err) {
                  // User cancelled or error occurred
                  if ((err as Error).name !== 'AbortError') {
                    // Fallback to clipboard
                    navigator.clipboard.writeText(shareUrl);
                    toast.success("Link copied to clipboard!");
                  }
                }
              } else {
                // Fallback for browsers without Web Share API
                navigator.clipboard.writeText(shareUrl);
                toast.success("Link copied to clipboard!");
              }
            }}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>

        {/* Blog Content */}
        <div className="prose prose-lg max-w-none">
          <div 
            className="blog-content text-foreground leading-relaxed"
            style={{
              whiteSpace: 'pre-wrap',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
          >
            {blog.content.split('\n').map((paragraph, index) => {
              // Handle headings
              if (paragraph.startsWith('# ')) {
                return <h1 key={index} className="text-4xl font-bold mt-8 mb-4 text-foreground">{paragraph.slice(2)}</h1>;
              }
              if (paragraph.startsWith('## ')) {
                return <h2 key={index} className="text-3xl font-bold mt-8 mb-4 text-foreground">{paragraph.slice(3)}</h2>;
              }
              if (paragraph.startsWith('### ')) {
                return <h3 key={index} className="text-2xl font-bold mt-6 mb-3 text-foreground">{paragraph.slice(4)}</h3>;
              }
              
              // Handle bold text with **
              if (paragraph.includes('**')) {
                const parts = paragraph.split('**');
                return (
                  <p key={index} className="mb-4 text-lg leading-relaxed">
                    {parts.map((part, i) => 
                      i % 2 === 0 ? part : <strong key={i} className="font-bold text-foreground">{part}</strong>
                    )}
                  </p>
                );
              }
              
              // Handle list items
              if (paragraph.trim().startsWith('- ')) {
                return (
                  <li key={index} className="ml-6 mb-2 text-lg list-disc">
                    {paragraph.slice(2)}
                  </li>
                );
              }
              
              // Handle numbered lists
              if (/^\d+\./.test(paragraph.trim())) {
                return (
                  <li key={index} className="ml-6 mb-2 text-lg list-decimal">
                    {paragraph.replace(/^\d+\.\s*/, '')}
                  </li>
                );
              }
              
              // Regular paragraphs
              if (paragraph.trim()) {
                return <p key={index} className="mb-4 text-lg leading-relaxed text-muted-foreground">{paragraph}</p>;
              }
              
              return null;
            })}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-border">
          {blog.tags.map((tag) => (
            <span
              key={tag}
              className="bg-muted text-muted-foreground px-4 py-2 rounded-full text-sm"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Author Info */}
        <div className="mt-12 p-6 bg-muted/30 rounded-2xl">
          <p className="text-sm text-muted-foreground mb-2">Written by</p>
          <p className="text-xl font-bold text-foreground">{blog.author}</p>
        </div>

        {/* Back to Home CTA */}
        <div className="mt-12 text-center">
          <Button
            size="lg"
            onClick={() => navigate('/')}
            className="shadow-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </article>
    </div>
  );
};

export default BlogPost;

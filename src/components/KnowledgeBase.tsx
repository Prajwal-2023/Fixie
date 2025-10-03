import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  BookOpen, 
  ArrowLeft,
  FileText,
  Lightbulb
} from 'lucide-react';
import { KnowledgeArticle } from '@/types/enhanced-types';

interface KnowledgeBaseProps {
  onBack?: () => void;
}

// Mock knowledge base data
const mockArticles: KnowledgeArticle[] = [
  {
    id: '1',
    title: 'How to Reset Your Password',
    content: 'Step-by-step guide for password reset...',
    excerpt: 'Learn how to reset your password using self-service.',
    category: 'Account Management',
    tags: ['password', 'reset', 'login'],
    is_published: true,
    view_count: 245,
    helpful_count: 38,
    not_helpful_count: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

export function KnowledgeBase({ onBack }: KnowledgeBaseProps) {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setArticles(mockArticles);
  }, []);

  const filteredArticles = useMemo(() => {
    return articles.filter(article => 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      article.is_published
    );
  }, [articles, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {onBack && (
                <Button variant="outline" size="sm" onClick={onBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
              <div className="flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold">Knowledge Base</h1>
                  <p className="text-sm text-muted-foreground">Self-service help articles</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex-1 relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {filteredArticles.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No articles found</h3>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {filteredArticles.map(article => (
                <Card key={article.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{article.title}</CardTitle>
                        <p className="text-muted-foreground text-sm mb-3">{article.excerpt}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <Badge variant="secondary">{article.category}</Badge>
                          <span>{article.view_count} views</span>
                        </div>
                      </div>
                      <Lightbulb className="h-5 w-5 text-primary flex-shrink-0 ml-4" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {article.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

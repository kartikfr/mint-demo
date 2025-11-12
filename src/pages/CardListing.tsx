import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, X } from "lucide-react";
import { cardService } from "@/services/cardService";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const CardListing = () => {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [displayCount, setDisplayCount] = useState(12);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [filters, setFilters] = useState<any>({
    banks_ids: [],
    annualFees: "",
    free_cards: "",
    credit_score: "",
    card_networks: [],
    age: "",
    spending_category: "",
    ltf: false
  });

  useEffect(() => {
    fetchCards();
  }, [filters]);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const response = await cardService.getCardListing({
        slug: "",
        banks_ids: filters.banks_ids,
        card_networks: filters.card_networks,
        annualFees: filters.annualFees,
        credit_score: filters.credit_score,
        sort_by: "relevance",
        free_cards: filters.free_cards,
        eligiblityPayload: {
          pincode: "110001",
          inhandIncome: "50000",
          empStatus: "salaried"
        },
        cardGeniusPayload: {}
      });

      if (response.data && response.data.cards) {
        setCards(response.data.cards);
      }
    } catch (error) {
      console.error('Failed to fetch cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setDisplayCount(12); // Reset display count on new search
    fetchCards();
  };

  const loadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setDisplayCount(prev => prev + 12);
      setIsLoadingMore(false);
    }, 500);
  };

  const handleFilterChange = (filterType: string, value: string | boolean) => {
    setFilters((prev: any) => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      banks_ids: [],
      annualFees: "",
      free_cards: "",
      credit_score: "",
      card_networks: [],
      age: "",
      spending_category: "",
      ltf: false
    });
    setSearchQuery("");
    setDisplayCount(12);
  };

  // Filter cards based on search and filters
  const getFilteredCards = () => {
    let filtered = [...cards];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(card => 
        card.name?.toLowerCase().includes(query) ||
        card.banks?.name?.toLowerCase().includes(query) ||
        card.card_type?.toLowerCase().includes(query)
      );
    }

    // LTF filter (Lifetime Free - 0 joining fee)
    if (filters.ltf) {
      filtered = filtered.filter(card => 
        card.joining_fee_text === "0" || 
        card.joining_fee_text === "Free" ||
        card.joining_fee_text?.toLowerCase() === "nil"
      );
    }

    // Age filter
    if (filters.age) {
      const age = parseInt(filters.age);
      filtered = filtered.filter(card => 
        card.min_age <= age && card.max_age >= age
      );
    }

    // Spending category filter
    if (filters.spending_category) {
      filtered = filtered.filter(card => 
        card.tags?.some((tag: any) => 
          tag.name?.toLowerCase() === filters.spending_category.toLowerCase()
        )
      );
    }

    return filtered;
  };

  const filteredCards = getFilteredCards();

  // Filter sidebar component
  const FilterSidebar = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-3">Lifetime Free (LTF)</h3>
        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            className="accent-primary w-4 h-4"
            checked={filters.ltf}
            onChange={(e) => handleFilterChange('ltf', e.target.checked)}
          />
          <span className="text-sm">Show only Lifetime Free cards (₹0 joining fee)</span>
        </label>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Age</h3>
        <Input
          type="number"
          placeholder="Enter your age"
          value={filters.age}
          onChange={(e) => handleFilterChange('age', e.target.value)}
          className="w-full"
          min="18"
          max="100"
        />
        <p className="text-xs text-muted-foreground mt-1">Cards matching your age range</p>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Spending Category</h3>
        <div className="space-y-2">
          {[
            { label: 'All Categories', value: '' },
            { label: 'Fuel', value: 'Fuel' },
            { label: 'Shopping', value: 'Shopping' },
            { label: 'Travel', value: 'Travel' },
            { label: 'Dining', value: 'Dining' },
            { label: 'Airport Lounge', value: 'Airport Lounge' },
            { label: 'Entertainment', value: 'Entertainment' }
          ].map((cat) => (
            <label key={cat.value} className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="category" 
                className="accent-primary"
                checked={filters.spending_category === cat.value}
                onChange={() => handleFilterChange('spending_category', cat.value)}
              />
              <span className="text-sm">{cat.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Annual Fee</h3>
        <div className="space-y-2">
          {[
            { label: 'All Cards', value: '' },
            { label: 'Free Cards', value: 'free' },
            { label: '₹0 - ₹500', value: '0-500' },
            { label: '₹500 - ₹2,000', value: '500-2000' },
            { label: '₹2,000+', value: '2000+' }
          ].map((fee) => (
            <label key={fee.value} className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="fee" 
                className="accent-primary"
                checked={filters.annualFees === fee.value}
                onChange={() => handleFilterChange('annualFees', fee.value)}
              />
              <span className="text-sm">{fee.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Credit Score</h3>
        <div className="space-y-2">
          {[
            { label: 'All Scores', value: '' },
            { label: 'Excellent (750+)', value: '750+' },
            { label: 'Good (650-750)', value: '650-750' },
            { label: 'Fair (550-650)', value: '550-650' }
          ].map((score) => (
            <label key={score.value} className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="score" 
                className="accent-primary"
                checked={filters.credit_score === score.value}
                onChange={() => handleFilterChange('credit_score', score.value)}
              />
              <span className="text-sm">{score.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Card Network</h3>
        <div className="space-y-2">
          {['Visa', 'Mastercard', 'RuPay', 'American Express'].map((network) => (
            <label key={network} className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                className="accent-primary"
                checked={filters.card_networks.includes(network.toLowerCase())}
                onChange={(e) => {
                  const value = network.toLowerCase();
                  setFilters((prev: any) => ({
                    ...prev,
                    card_networks: e.target.checked
                      ? [...prev.card_networks, value]
                      : prev.card_networks.filter((n: string) => n !== value)
                  }));
                }}
              />
              <span className="text-sm">{network}</span>
            </label>
          ))}
        </div>
      </div>

      <Button variant="outline" className="w-full" onClick={clearFilters}>
        Clear All Filters
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Search */}
      <section className="pt-28 pb-12 bg-gradient-hero">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl lg:text-5xl font-bold text-center mb-6">
            Explore 200+ Credit Cards
          </h1>
          
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search by card name, bank, or benefit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-12 h-14 text-lg"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      handleSearch();
                    }}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              <Button size="lg" onClick={handleSearch}>
                Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex gap-8">
            {/* Desktop Filters Sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-28 bg-card rounded-2xl shadow-lg p-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
                <h2 className="text-xl font-bold mb-6">Filters</h2>
                <FilterSidebar />
              </div>
            </aside>

            {/* Card Grid */}
            <div className="flex-1">
              {/* Mobile Filter Button */}
              <div className="lg:hidden mb-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {Math.min(displayCount, filteredCards.length)} of {filteredCards.length} cards
                </p>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="w-4 h-4 mr-2" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterSidebar />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Active Filters */}
              {(filters.ltf || filters.age || filters.spending_category || searchQuery) && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {searchQuery && (
                    <Badge variant="secondary" className="gap-2">
                      Search: {searchQuery}
                      <X 
                        className="w-3 h-3 cursor-pointer" 
                        onClick={() => {
                          setSearchQuery("");
                          handleSearch();
                        }}
                      />
                    </Badge>
                  )}
                  {filters.ltf && (
                    <Badge variant="secondary" className="gap-2">
                      Lifetime Free
                      <X 
                        className="w-3 h-3 cursor-pointer" 
                        onClick={() => handleFilterChange('ltf', false)}
                      />
                    </Badge>
                  )}
                  {filters.age && (
                    <Badge variant="secondary" className="gap-2">
                      Age: {filters.age}
                      <X 
                        className="w-3 h-3 cursor-pointer" 
                        onClick={() => handleFilterChange('age', '')}
                      />
                    </Badge>
                  )}
                  {filters.spending_category && (
                    <Badge variant="secondary" className="gap-2">
                      {filters.spending_category}
                      <X 
                        className="w-3 h-3 cursor-pointer" 
                        onClick={() => handleFilterChange('spending_category', '')}
                      />
                    </Badge>
                  )}
                </div>
              )}

              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-4 text-muted-foreground">Loading cards...</p>
                </div>
              ) : filteredCards.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-xl text-muted-foreground">No cards found matching your criteria</p>
                  <Button variant="outline" className="mt-4" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredCards.slice(0, displayCount).map((card, index) => (
                      <div
                        key={card.id || index}
                        className="bg-card rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all hover:-translate-y-2"
                      >
                        <div className="relative h-48 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center p-4">
                          {card.ltf === true && (
                            <Badge className="absolute top-3 right-3 bg-green-500">LTF</Badge>
                          )}
                          <img
                            src={card.card_bg_image || card.image}
                            alt={card.name}
                            className="max-h-full max-w-full object-contain"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder.svg';
                            }}
                          />
                        </div>

                        <div className="p-6">
                          <div className="mb-2 flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {card.card_type}
                            </Badge>
                            {card.banks?.name && (
                              <span className="text-xs text-muted-foreground">{card.banks.name}</span>
                            )}
                          </div>
                          
                          <h3 className="text-xl font-bold mb-3 line-clamp-2">{card.name}</h3>
                          
                          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg mb-4">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Joining Fee</p>
                              <p className="text-sm font-semibold">
                                {card.joining_fee_text === "0" || card.joining_fee_text?.toLowerCase() === "free" 
                                  ? "Free" 
                                  : `₹${card.joining_fee_text}`}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Annual Fee</p>
                              <p className="text-sm font-semibold">
                                {card.annual_fee_text === "0" || card.annual_fee_text?.toLowerCase() === "free" 
                                  ? "Free" 
                                  : `₹${card.annual_fee_text}`}
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Link to={`/cards/${card.seo_card_alias || card.card_alias}`} className="flex-1">
                              <Button variant="outline" className="w-full">Details</Button>
                            </Link>
                            <Button 
                              className="flex-1"
                              onClick={() => {
                                if (card.network_url) {
                                  window.open(card.network_url, '_blank', 'noopener,noreferrer');
                                }
                              }}
                            >
                              Apply
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Load More Button */}
                  {displayCount < filteredCards.length && (
                    <div className="text-center mt-8">
                      <Button 
                        size="lg" 
                        variant="outline" 
                        onClick={loadMore}
                        disabled={isLoadingMore}
                      >
                        {isLoadingMore ? (
                          <>
                            <div className="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                            Loading...
                          </>
                        ) : (
                          `Load More Cards (${filteredCards.length - displayCount} remaining)`
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CardListing;

import { useState } from "react";
import { Button } from "./ui/button";
import { ShoppingBag, Utensils, Fuel, Plane, Coffee, ShoppingCart, CreditCard, ChevronDown, TrendingUp, Sparkles } from "lucide-react";
import { cardService, SpendingData } from "@/services/cardService";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { SpendingInput } from "./ui/spending-input";

const categories = [
  { 
    id: 'shopping', 
    name: 'Shopping', 
    icon: ShoppingBag, 
    color: 'text-pink-500',
    questions: [
      { field: 'amazon_spends', question: 'How much do you spend on Amazon in a month?', emoji: '🛍️', min: 0, max: 100000, step: 500 },
      { field: 'flipkart_spends', question: 'How much do you spend on Flipkart in a month?', emoji: '📦', min: 0, max: 100000, step: 500 },
      { field: 'other_online_spends', question: 'How much do you spend on other online shopping?', emoji: '💸', min: 0, max: 50000, step: 500 },
      { field: 'other_offline_spends', question: 'How much do you spend at local shops or offline stores monthly?', emoji: '🏪', min: 0, max: 100000, step: 1000 },
    ]
  },
  { 
    id: 'bills', 
    name: 'Paying Bills', 
    icon: CreditCard, 
    color: 'text-indigo-500',
    questions: [
      { field: 'mobile_phone_bills', question: 'How much do you spend on recharging your mobile or Wi-Fi monthly?', emoji: '📱', min: 0, max: 10000, step: 100 },
      { field: 'electricity_bills', question: "What's your average monthly electricity bill?", emoji: '⚡️', min: 0, max: 10000, step: 100 },
      { field: 'water_bills', question: 'And what about your monthly water bill?', emoji: '💧', min: 0, max: 5000, step: 100 },
      { field: 'insurance_health_annual', question: 'How much do you pay for health or term insurance annually?', emoji: '🛡️', min: 0, max: 100000, step: 5000 },
    ]
  },
  { 
    id: 'fuel', 
    name: 'Fuel', 
    icon: Fuel, 
    color: 'text-blue-500',
    questions: [
      { field: 'fuel', question: 'How much do you spend on fuel in a month?', emoji: '⛽', min: 0, max: 20000, step: 500 },
    ]
  },
  { 
    id: 'travel', 
    name: 'Flight & Hotel', 
    icon: Plane, 
    color: 'text-purple-500',
    questions: [
      { field: 'flights_annual', question: 'How much do you spend on flights in a year?', emoji: '✈️', min: 0, max: 500000, step: 5000 },
      { field: 'hotels_annual', question: 'How much do you spend on hotel stays in a year?', emoji: '🛌', min: 0, max: 300000, step: 5000 },
      { field: 'domestic_lounge_usage_quarterly', question: 'How often do you visit domestic airport lounges in a year?', emoji: '🇮🇳', min: 0, max: 50, step: 1 },
      { field: 'international_lounge_usage_quarterly', question: 'Plus, what about international airport lounges?', emoji: '🌎', min: 0, max: 50, step: 1 },
    ]
  },
  { 
    id: 'food_delivery', 
    name: 'Food Delivery', 
    icon: Coffee, 
    color: 'text-red-500',
    questions: [
      { field: 'online_food_ordering', question: 'How much do you spend on food delivery apps in a month?', emoji: '🛵🍜', min: 0, max: 30000, step: 500 },
    ]
  },
  { 
    id: 'grocery', 
    name: 'Grocery', 
    icon: ShoppingCart, 
    color: 'text-green-500',
    questions: [
      { field: 'grocery_spends_online', question: 'How much do you spend on groceries (Blinkit, Zepto etc.) every month?', emoji: '🥦', min: 0, max: 50000, step: 500 },
    ]
  },
  { 
    id: 'dining', 
    name: 'Dining Out', 
    icon: Utensils, 
    color: 'text-orange-500',
    questions: [
      { field: 'dining_or_going_out', question: 'How much do you spend on dining out in a month?', emoji: '🥗', min: 0, max: 30000, step: 500 },
    ]
  },
];

const CategoryCardGenius = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showQuestions, setShowQuestions] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);

  const selectedCategoryData = categories.find(c => c.id === selectedCategory);
  const currentQuestion = selectedCategoryData?.questions[currentQuestionIndex];

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setShowQuestions(true);
    setCurrentQuestionIndex(0);
    setResponses({});
    setResults(null);
    setShowResults(false);
  };

  const handleNext = () => {
    if (!selectedCategoryData) return;
    
    if (currentQuestionIndex < selectedCategoryData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Submit to API
      handleCalculate();
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleCalculate = async () => {
    setLoading(true);
    try {
      // Prepare the payload with all fields set to 0 except user inputs
      const payload: SpendingData = {
        amazon_spends: 0,
        flipkart_spends: 0,
        other_online_spends: 0,
        other_offline_spends: 0,
        grocery_spends_online: 0,
        online_food_ordering: 0,
        fuel: 0,
        dining_or_going_out: 0,
        flights_annual: 0,
        hotels_annual: 0,
        domestic_lounge_usage_quarterly: 0,
        international_lounge_usage_quarterly: 0,
        mobile_phone_bills: 0,
        electricity_bills: 0,
        water_bills: 0,
        insurance_health_annual: 0,
        insurance_car_or_bike_annual: 0,
        rent: 0,
        school_fees: 0,
        ...responses
      };

      const response = await cardService.calculateCardGenius(payload);
      
      if (response.status === 'success' && response.data) {
        // Sort by total_savings_yearly and get top 3
        const sortedCards = response.data.sort((a: any, b: any) => 
          (b.total_savings_yearly || 0) - (a.total_savings_yearly || 0)
        ).slice(0, 3);
        
        setResults(sortedCards);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Error calculating:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetCalculator = () => {
    setSelectedCategory(null);
    setShowQuestions(false);
    setCurrentQuestionIndex(0);
    setResponses({});
    setResults(null);
    setShowResults(false);
  };

  if (showResults && results) {
    return (
      <section className="py-20 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-semibold">Your Personalized Results</span>
            </div>
            <h2 className="text-4xl font-bold mb-4">Top 3 Cards Just For You</h2>
            <p className="text-xl text-muted-foreground">
              Based on your {selectedCategoryData?.name.toLowerCase()} spending, here are your best matches
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {results.map((card: any, index: number) => (
              <div
                key={card.id || index}
                className="bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-primary/20"
              >
                {index === 0 && (
                  <div className="bg-gradient-to-r from-primary to-secondary text-white text-center py-2 text-sm font-bold">
                    🏆 Best Match
                  </div>
                )}
                
                <div className="relative h-56 overflow-hidden bg-gradient-to-br from-muted to-muted/50">
                  <img
                    src={card.card_bg_image}
                    alt={card.card_name}
                    className="w-full h-full object-contain p-6"
                  />
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold mb-4">{card.card_name}</h3>

                  {/* Savings Highlight */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-semibold text-green-800">Annual Savings</span>
                    </div>
                    <p className="text-3xl font-bold text-green-600">
                      ₹{card.total_savings_yearly?.toLocaleString() || '0'}
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      Save this much every year with your current spending
                    </p>
                  </div>

                  {/* Fees */}
                  <div className="grid grid-cols-2 gap-3 p-3 bg-muted/50 rounded-lg mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Joining Fee</p>
                      <p className="font-bold text-sm">
                        {card.joining_fees === 0 ? 'FREE' : `₹${card.joining_fees?.toLocaleString()}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Annual Fee</p>
                      <p className="font-bold text-sm">
                        {card.annual_fees === 0 ? 'FREE' : `₹${card.annual_fees?.toLocaleString()}`}
                      </p>
                    </div>
                  </div>

                  {/* Category Savings Breakdown */}
                  {card.category_savings && (
                    <details className="mb-4">
                      <summary className="cursor-pointer text-sm font-semibold text-primary hover:text-primary/80 flex items-center gap-2">
                        <ChevronDown className="w-4 h-4" />
                        View Detailed Savings Breakdown
                      </summary>
                      <div className="mt-3 space-y-2 pl-2">
                        {Object.entries(card.category_savings).map(([category, savings]: [string, any]) => (
                          <div key={category} className="flex justify-between text-sm">
                            <span className="text-muted-foreground capitalize">
                              {category.replace(/_/g, ' ')}
                            </span>
                            <span className="font-semibold text-green-600">
                              ₹{savings?.toLocaleString() || '0'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}

                  <div className="space-y-2">
                    <Button className="w-full" size="lg">
                      Apply Now
                    </Button>
                    <Button variant="outline" className="w-full" size="sm">
                      View Full Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button
              variant="outline"
              size="lg"
              onClick={resetCalculator}
              className="shadow-lg"
            >
              Try Another Category
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (showQuestions && selectedCategoryData && currentQuestion) {
    const progress = ((currentQuestionIndex + 1) / selectedCategoryData.questions.length) * 100;

    return (
      <section className="py-20 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {/* Progress */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-muted-foreground">
                  Question {currentQuestionIndex + 1} of {selectedCategoryData.questions.length}
                </span>
                <span className="text-sm font-bold text-primary">
                  {Math.round(progress)}% Complete
                </span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Question */}
            <div className="animate-fade-in">
              <SpendingInput
                question={currentQuestion.question}
                emoji={currentQuestion.emoji}
                value={responses[currentQuestion.field] || 0}
                onChange={(value) => setResponses(prev => ({ ...prev, [currentQuestion.field]: value }))}
                min={currentQuestion.min}
                max={currentQuestion.max}
                step={currentQuestion.step}
              />
            </div>

            {/* Navigation */}
            <div className="flex gap-4 mt-8">
              <Button
                variant="outline"
                size="lg"
                onClick={handlePrev}
                disabled={currentQuestionIndex === 0}
                className="flex-1"
              >
                Previous
              </Button>
              <Button
                size="lg"
                onClick={handleNext}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  'Calculating...'
                ) : currentQuestionIndex === selectedCategoryData.questions.length - 1 ? (
                  <>
                    Show My Results
                    <Sparkles className="ml-2 w-4 h-4" />
                  </>
                ) : (
                  'Next'
                )}
              </Button>
            </div>

            <div className="text-center mt-6">
              <button
                onClick={resetCalculator}
                className="text-muted-foreground hover:text-primary font-medium transition-colors text-sm"
              >
                ← Back to Categories
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-semibold">Smart Card Calculator</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Find Your Perfect Card in 30 Seconds
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Tell us where you spend, and we'll calculate exactly how much you can save with the right credit card
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-12">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategorySelect(category.id)}
              className={`p-6 rounded-2xl bg-card shadow-md hover:shadow-xl transition-all text-center group relative overflow-hidden ${
                selectedCategory === category.id ? 'ring-2 ring-primary shadow-glow' : ''
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <category.icon className={`w-8 h-8 mx-auto mb-3 ${category.color} group-hover:scale-110 transition-transform relative z-10`} />
              <p className="text-sm font-semibold relative z-10">{category.name}</p>
            </button>
          ))}
        </div>

        <div className="max-w-2xl mx-auto text-center bg-card rounded-2xl p-8 shadow-lg">
          <p className="text-lg text-muted-foreground mb-6">
            💡 <strong>How it works:</strong> Pick a category above, answer quick questions about your spending, 
            and instantly see the top 3 cards that'll save you the most money
          </p>
          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">1</div>
              <span>Choose Category</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">2</div>
              <span>Answer Questions</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">3</div>
              <span>Get Top 3 Cards</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CategoryCardGenius;

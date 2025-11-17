import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { SpendingInput } from "@/components/ui/spending-input";
import { ArrowLeft, ArrowRight, Loader2, Trophy, TrendingUp, Award, Sparkles, ChevronDown, Shield, CheckCircle2, Zap, Home } from "lucide-react";
import { cardService, SpendingData } from "@/services/cardService";
import { toast } from "sonner";
import { CardSearchDropdown } from "@/components/CardSearchDropdown";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { openRedirectInterstitial } from "@/utils/redirectHandler";
import { Badge } from "@/components/ui/badge";
interface CategorySavings {
  category: string;
  emoji: string;
  userSaving: number;
  geniusSaving: number;
}
interface Card {
  id: number;
  name: string;
  seo_card_alias: string;
  image: string;
  banks?: {
    name: string;
  };
  annual_saving?: number;
  total_savings_yearly?: number;
  joining_fees?: string;
  card_type?: string;
  annual_fee?: string;
  reward_rate?: string;
  welcome_bonus?: string;
  key_benefits?: string[];
  spending_breakdown_array?: SpendingBreakdownItem[];
}
interface SpendingBreakdownItem {
  on: string;
  spend: number;
  points_earned: number;
  savings: number;
  explanation?: string;
  conv_rate?: number;
  maxCap?: number;
}
interface SpendingQuestion {
  field: keyof SpendingData;
  question: string;
  emoji: string;
  min: number;
  max: number;
  step: number;
  showCurrency?: boolean;
  suffix?: string;
}
const questions: SpendingQuestion[] = [{
  field: 'amazon_spends',
  question: 'How much do you spend on Amazon in a month?',
  emoji: '🛍️',
  min: 0,
  max: 100000,
  step: 500
}, {
  field: 'flipkart_spends',
  question: 'How much do you spend on Flipkart in a month?',
  emoji: '📦',
  min: 0,
  max: 100000,
  step: 500
}, {
  field: 'other_online_spends',
  question: 'How much do you spend on other online shopping?',
  emoji: '💸',
  min: 0,
  max: 50000,
  step: 500
}, {
  field: 'other_offline_spends',
  question: 'How much do you spend at local shops or offline stores monthly?',
  emoji: '🏪',
  min: 0,
  max: 100000,
  step: 1000
}, {
  field: 'grocery_spends_online',
  question: 'How much do you spend on groceries (Blinkit, Zepto etc.) every month?',
  emoji: '🥦',
  min: 0,
  max: 50000,
  step: 500
}, {
  field: 'online_food_ordering',
  question: 'How much do you spend on food delivery apps in a month?',
  emoji: '🛵🍜',
  min: 0,
  max: 30000,
  step: 500
}, {
  field: 'fuel',
  question: 'How much do you spend on fuel in a month?',
  emoji: '⛽',
  min: 0,
  max: 20000,
  step: 500
}, {
  field: 'dining_or_going_out',
  question: 'How much do you spend on dining out in a month?',
  emoji: '🥗',
  min: 0,
  max: 30000,
  step: 500
}, {
  field: 'flights_annual',
  question: 'How much do you spend on flights in a year?',
  emoji: '✈️',
  min: 0,
  max: 500000,
  step: 5000
}, {
  field: 'hotels_annual',
  question: 'How much do you spend on hotel stays in a year?',
  emoji: '🛌',
  min: 0,
  max: 300000,
  step: 5000
}, {
  field: 'domestic_lounge_usage_quarterly',
  question: 'How often do you visit domestic airport lounges in a year?',
  emoji: '🇮🇳',
  min: 0,
  max: 50,
  step: 1
}, {
  field: 'international_lounge_usage_quarterly',
  question: 'Plus, what about international airport lounges?',
  emoji: '🌎',
  min: 0,
  max: 50,
  step: 1
}, {
  field: 'mobile_phone_bills',
  question: 'How much do you spend on recharging your mobile or Wi-Fi monthly?',
  emoji: '📱',
  min: 0,
  max: 10000,
  step: 100
}, {
  field: 'electricity_bills',
  question: "What's your average monthly electricity bill?",
  emoji: '⚡️',
  min: 0,
  max: 20000,
  step: 500
}, {
  field: 'water_bills',
  question: 'And what about your monthly water bill?',
  emoji: '💧',
  min: 0,
  max: 5000,
  step: 100
}, {
  field: 'insurance_health_annual',
  question: 'How much do you pay for health or term insurance annually?',
  emoji: '🛡️',
  min: 0,
  max: 100000,
  step: 1000
}, {
  field: 'insurance_car_or_bike_annual',
  question: 'How much do you pay for car or bike insurance annually?',
  emoji: '🚗',
  min: 0,
  max: 50000,
  step: 1000
}, {
  field: 'rent',
  question: 'How much do you pay for house rent every month?',
  emoji: '🏠',
  min: 0,
  max: 100000,
  step: 1000
}, {
  field: 'school_fees',
  question: 'How much do you pay in school fees monthly?',
  emoji: '🎓',
  min: 0,
  max: 50000,
  step: 1000
}];
// Normalization helpers to handle API inconsistencies
const normalizeAlias = (item: any): string => {
  return item?.seo_card_alias || item?.card_alias || '';
};

const normalizeCardListItem = (item: any): Card => {
  return {
    ...item,
    seo_card_alias: item.seo_card_alias || item.card_alias
  };
};

const getTotalSavings = (item: any): number => {
  return Number(item.total_savings_yearly ?? item.total_savings ?? 0);
};

const normalizeBreakdown = (item: any): SpendingBreakdownItem[] => {
  // If array exists, use it
  const arr = item.spending_breakdown_array;
  if (Array.isArray(arr) && arr.length > 0) return arr;
  
  // Otherwise, try to convert spending_breakdown object to array
  const obj = item.spending_breakdown;
  if (obj && typeof obj === 'object') {
    return Object.entries(obj).map(([on, v]: any) => ({
      on,
      spend: v?.spend ?? 0,
      points_earned: v?.points_earned ?? 0,
      savings: v?.savings ?? v ?? 0,
      explanation: v?.explanation,
      conv_rate: v?.conv_rate,
      maxCap: v?.maxCap
    }));
  }
  
  return [];
};

const BeatMyCard = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'select' | 'questions' | 'results'>('select');
  const [cards, setCards] = useState<Card[]>([]);
  const [filteredCards, setFilteredCards] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<SpendingData>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [userCardData, setUserCardData] = useState<Card | null>(null);
  const [geniusCardData, setGeniusCardData] = useState<Card | null>(null);
  const [categorySavings, setCategorySavings] = useState<CategorySavings[]>([]);
  useEffect(() => {
    fetchCards();
  }, []);
  const fetchCards = async () => {
    setIsLoading(true);
    try {
      const response = await cardService.getPartnerCards();
      if (response.status === "success" && response.data && Array.isArray(response.data)) {
        // Normalize all cards to ensure consistent alias usage
        const normalizedCards = response.data.map(normalizeCardListItem);
        setCards(normalizedCards);
        setFilteredCards(normalizedCards);
        console.info("✅ Fetched and normalized cards:", normalizedCards.length);
      } else {
        setCards([]);
        setFilteredCards([]);
      }
    } catch (error) {
      toast.error("Failed to fetch cards");
      console.error(error);
      setCards([]);
      setFilteredCards([]);
    } finally {
      setIsLoading(false);
    }
  };
  const handleCardSelect = (card: Card) => {
    setSelectedCard(card);
    setStep('questions');
  };
  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      calculateResults();
    }
  };
  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  const handleSkip = () => {
    // Skip current question (leave value as 0 or undefined)
    handleNext();
  };
  const handleSkipAll = () => {
    // Skip all remaining questions and calculate
    calculateResults();
  };
  const calculateResults = async () => {
    if (!selectedCard) {
      toast.error("No card selected");
      return;
    }
    setIsCalculating(true);
    try {
      // Ensure all required fields are present with default value of 0
      const completePayload: SpendingData = {
        amazon_spends: responses.amazon_spends || 0,
        flipkart_spends: responses.flipkart_spends || 0,
        other_online_spends: responses.other_online_spends || 0,
        other_offline_spends: responses.other_offline_spends || 0,
        grocery_spends_online: responses.grocery_spends_online || 0,
        online_food_ordering: responses.online_food_ordering || 0,
        fuel: responses.fuel || 0,
        dining_or_going_out: responses.dining_or_going_out || 0,
        flights_annual: responses.flights_annual || 0,
        hotels_annual: responses.hotels_annual || 0,
        domestic_lounge_usage_quarterly: responses.domestic_lounge_usage_quarterly || 0,
        international_lounge_usage_quarterly: responses.international_lounge_usage_quarterly || 0,
        mobile_phone_bills: responses.mobile_phone_bills || 0,
        electricity_bills: responses.electricity_bills || 0,
        water_bills: responses.water_bills || 0,
        insurance_health_annual: responses.insurance_health_annual || 0,
        insurance_car_or_bike_annual: responses.insurance_car_or_bike_annual || 0,
        rent: responses.rent || 0,
        school_fees: responses.school_fees || 0
      };
      const calculateResponse = await cardService.calculateCardGenius(completePayload);
      console.info("📊 Card Genius API Response received");

      if (calculateResponse.status === "success" && calculateResponse.data?.success && calculateResponse.data?.savings && calculateResponse.data.savings.length > 0) {
        const savingsArray = calculateResponse.data.savings;
        
        // Normalize all results for consistent comparison
        const normalized = savingsArray.map((s: any) => ({
          ...s,
          seo_card_alias: s.seo_card_alias || s.card_alias,
          total_savings_unified: getTotalSavings(s),
          spending_breakdown_array: normalizeBreakdown(s)
        }));
        
        console.info("✅ Normalized", normalized.length, "card results");

        // Sort by unified total savings to get the top card
        const sortedCards = [...normalized].sort((a: any, b: any) => {
          return b.total_savings_unified - a.total_savings_unified;
        });
        const topCard = sortedCards[0];
        console.info("🏆 Top card:", topCard?.card_name, "with savings:", topCard?.total_savings_unified);

        // Find the user's selected card in the results by matching normalized alias
        const selectedAlias = normalizeAlias(selectedCard);
        const userCardInResults = normalized.find((card: any) => card.seo_card_alias === selectedAlias);
        
        console.info("🔍 Selected card alias:", selectedAlias);
        console.info("📌 User card found in results:", !!userCardInResults);
        
        if (!userCardInResults) {
          console.warn("⚠️ User's card not found in results, showing top card only");
          toast.info("Your card wasn't in our comparison, but here's the top recommendation!");
          // Continue anyway and show results with just the top card
        }

        console.info("🔄 Fetching detailed card data...");
        console.info("User card alias for fetch:", selectedAlias);
        console.info("Top card alias for fetch:", topCard.seo_card_alias);

        // Fetch detailed data for both cards with fallbacks
        let userCardData = null;
        let geniusCardData = null;
        
        try {
          const fetchPromises = [];
          
          // Only fetch user card if it exists in results
          if (userCardInResults) {
            fetchPromises.push(
              cardService.getCardDetailsByAlias(selectedAlias).catch(err => {
                console.error("User card fetch failed:", err);
                return null;
              })
            );
          } else {
            fetchPromises.push(Promise.resolve(null));
          }
          
          fetchPromises.push(
            cardService.getCardDetailsByAlias(topCard.seo_card_alias).catch(err => {
              console.error("Genius card fetch failed:", err);
              return null;
            })
          );
          
          const [userCard, geniusCard] = await Promise.all(fetchPromises);
          
          console.info("📦 User Card Details:", userCard?.status);
          console.info("📦 Genius Card Details:", geniusCard?.status);

          // Build user's card data
          if (userCardInResults) {
            if (userCard?.status === "success" && userCard.data?.[0]) {
              userCardData = {
                ...userCard.data[0],
                seo_card_alias: selectedAlias,
                image: userCardInResults.image || userCard.data[0].image,
                annual_saving: userCardInResults.total_savings_unified || 0,
                total_savings_yearly: userCardInResults.total_savings_yearly || 0,
                spending_breakdown_array: userCardInResults.spending_breakdown_array || []
              };
            } else {
              // Fallback: Create card data from API response
              userCardData = {
                id: userCardInResults.id,
                name: userCardInResults.card_name || selectedCard.name,
                seo_card_alias: selectedAlias,
                image: userCardInResults.image || selectedCard.image || '',
                annual_saving: userCardInResults.total_savings_unified || 0,
                total_savings_yearly: userCardInResults.total_savings_yearly || 0,
                spending_breakdown_array: userCardInResults.spending_breakdown_array || [],
                banks: selectedCard.banks || { name: userCardInResults.card_name?.split(' ')[0] || '' }
              };
              console.info("Using fallback user card data");
            }
          }

          // Build genius card data
          if (geniusCard?.status === "success" && geniusCard.data?.[0]) {
            geniusCardData = {
              ...geniusCard.data[0],
              seo_card_alias: topCard.seo_card_alias,
              image: topCard.image || geniusCard.data[0].image,
              annual_saving: topCard.total_savings_unified || 0,
              total_savings_yearly: topCard.total_savings_yearly || 0,
              spending_breakdown_array: topCard.spending_breakdown_array || []
            };
          } else {
            // Fallback: Create card data from API response
            geniusCardData = {
              id: topCard.id,
              name: topCard.card_name,
              seo_card_alias: topCard.seo_card_alias,
              image: topCard.image || '',
              annual_saving: topCard.total_savings_unified || 0,
              total_savings_yearly: topCard.total_savings_yearly || 0,
              spending_breakdown_array: topCard.spending_breakdown_array || [],
              banks: { name: topCard.card_name?.split(' ')[0] || '' }
            };
            console.info("Using fallback genius card data");
          }
          
          console.info("✅ User Card Data ready:", !!userCardData);
          console.info("✅ Genius Card Data ready:", !!geniusCardData);

          // Calculate category-wise savings (handles null userCardData gracefully)
          const categoryBreakdown = calculateCategorySavings(responses, userCardData, geniusCardData);
          setCategorySavings(categoryBreakdown);
          setUserCardData(userCardData);
          setGeniusCardData(geniusCardData);
          
          console.info("🎯 Transitioning to results step");
          setStep('results');
        } catch (error) {
          console.error("Error processing card data:", error);
          toast.error("Failed to process card comparison");
        }
      } else {
        console.error("Invalid API response structure:", calculateResponse);
        toast.error("No results found. Please try again.");
      }
    } catch (error) {
      toast.error("Failed to calculate results");
      console.error("Calculate Results Error:", error);
    } finally {
      setIsCalculating(false);
    }
  };
  const calculateCategorySavings = (spending: SpendingData, userCard: Card | null, geniusCard: Card): CategorySavings[] => {
    const categories: CategorySavings[] = [];

    // Map of spending categories to display names and emojis
    const categoryMap: {
      [key: string]: {
        name: string;
        emoji: string;
      };
    } = {
      amazon_spends: {
        name: 'Amazon Shopping',
        emoji: '🛍️'
      },
      flipkart_spends: {
        name: 'Flipkart Shopping',
        emoji: '📦'
      },
      other_online_spends: {
        name: 'Online Shopping',
        emoji: '💸'
      },
      other_offline_spends: {
        name: 'Offline Shopping',
        emoji: '🏪'
      },
      grocery_spends_online: {
        name: 'Groceries',
        emoji: '🥦'
      },
      online_food_ordering: {
        name: 'Food Delivery',
        emoji: '🛵'
      },
      fuel: {
        name: 'Fuel',
        emoji: '⛽'
      },
      dining_or_going_out: {
        name: 'Dining Out',
        emoji: '🥗'
      },
      flights_annual: {
        name: 'Flight Bookings',
        emoji: '✈️'
      },
      hotels_annual: {
        name: 'Hotel Stays',
        emoji: '🛌'
      },
      mobile_phone_bills: {
        name: 'Mobile & WiFi',
        emoji: '📱'
      },
      electricity_bills: {
        name: 'Electricity',
        emoji: '⚡'
      },
      water_bills: {
        name: 'Water',
        emoji: '💧'
      },
      insurance_health_annual: {
        name: 'Health Insurance',
        emoji: '🛡️'
      },
      insurance_car_or_bike_annual: {
        name: 'Vehicle Insurance',
        emoji: '🚗'
      },
      rent: {
        name: 'House Rent',
        emoji: '🏠'
      },
      school_fees: {
        name: 'School Fees',
        emoji: '🎓'
      }
    };

    // Create lookup maps for both cards' spending breakdown
    const userBreakdownMap = new Map<string, number>();
    const geniusBreakdownMap = new Map<string, number>();

    // Populate user card savings by category (handle null gracefully)
    if (userCard?.spending_breakdown_array) {
      userCard.spending_breakdown_array.forEach(item => {
        if (item.on && item.savings) {
          userBreakdownMap.set(item.on, item.savings);
        }
      });
    }

    // Populate genius card savings by category
    if (geniusCard.spending_breakdown_array) {
      geniusCard.spending_breakdown_array.forEach(item => {
        if (item.on && item.savings) {
          geniusBreakdownMap.set(item.on, item.savings);
        }
      });
    }
    
    console.info("📊 Category breakdown maps created");

    // Build category comparison list
    const allCategories = new Set([...userBreakdownMap.keys(), ...geniusBreakdownMap.keys()]);
    allCategories.forEach(categoryKey => {
      if (categoryMap[categoryKey]) {
        const categoryInfo = categoryMap[categoryKey];
        const userSaving = Math.round(userBreakdownMap.get(categoryKey) || 0);
        const geniusSaving = Math.round(geniusBreakdownMap.get(categoryKey) || 0);

        // Only show categories with meaningful savings
        if (userSaving > 0 || geniusSaving > 0) {
          categories.push({
            category: categoryInfo.name,
            emoji: categoryInfo.emoji,
            userSaving: userSaving,
            geniusSaving: geniusSaving
          });
        }
      }
    });

    // Sort by the higher saving value between the two cards
    return categories.sort((a, b) => Math.max(b.userSaving, b.geniusSaving) - Math.max(a.userSaving, a.geniusSaving));
  };
  const isUserWinner = userCardData && geniusCardData && (userCardData.annual_saving ?? 0) >= (geniusCardData.annual_saving ?? 0);

  // Render card selection
  if (step === 'select') {
    return <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 pt-24">
          {/* Header with Home Button */}
          <div className="flex items-center justify-between mb-8">
            
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h1 className="text-5xl md:text-6xl font-bold mb-5 bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                Beat My Card
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto md:text-lg">
                Select your current card and see if Card Genius can find a better match
              </p>
              
              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
                <Badge variant="secondary" className="px-4 py-2 text-sm font-medium bg-secondary/10 text-secondary border-secondary/20 hover:bg-secondary/20 transition-colors">
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI-Powered
                </Badge>
                <Badge variant="secondary" className="px-4 py-2 text-sm font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
                  <Shield className="w-4 h-4 mr-2" />
                  Unbiased Results
                </Badge>
                <Badge variant="secondary" className="px-4 py-2 text-sm font-medium bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20 transition-colors">
                  <Zap className="w-4 h-4 mr-2" />
                  Instant Comparison
                </Badge>
              </div>
            </div>

            <CardSearchDropdown cards={filteredCards} selectedCard={selectedCard} onCardSelect={handleCardSelect} onClearSelection={() => setSelectedCard(null)} isLoading={isLoading} />
          </div>
        </div>
      </div>;
  }

  // Render questionnaire
  if (step === 'questions') {
    const question = questions[currentStep];
    const progress = (currentStep + 1) / questions.length * 100;
    
    const handleSkipAll = () => {
      calculateResults();
    };
    
    const handleSkipQuestion = () => {
      if (currentStep < questions.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        calculateResults();
      }
    };
    
    return <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="max-w-3xl mx-auto">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">
                  Question {currentStep + 1} of {questions.length}
                </span>
                <span className="text-sm font-medium text-primary">
                  {Math.round(progress)}% Complete
                </span>
              </div>
              <div className="h-2.5 bg-secondary/20 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-secondary to-primary transition-all duration-500 ease-out rounded-full" style={{
                width: `${progress}%`
              }} />
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-card border border-border rounded-3xl p-8 md:p-10 shadow-lg">
              <h2 className="text-2xl md:text-3xl font-bold mb-8 text-foreground flex items-center gap-3">
                {question.question} <span className="text-4xl">{question.emoji}</span>
              </h2>

              <SpendingInput question={question.question} emoji={question.emoji} value={responses[question.field] || 0} onChange={value => setResponses(prev => ({
              ...prev,
              [question.field]: value
            }))} min={question.min} max={question.max} step={question.step} showCurrency={question.showCurrency} suffix={question.suffix} />

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mt-10">
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={handlePrev} 
                  disabled={currentStep === 0} 
                  className="flex-1 border-2 hover:bg-secondary/10 text-base py-6"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={handleSkipAll} 
                  className="sm:flex-1 border-2 hover:bg-muted text-base py-6"
                >
                  Skip All
                </Button>
                <Button 
                  size="lg" 
                  onClick={handleNext} 
                  className="flex-1 bg-primary hover:bg-primary/90 text-base py-6"
                >
                  {currentStep === questions.length - 1 ? 'Show Results' : 'Next'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
              
              {/* Skip this question link */}
              <div className="text-center mt-6">
                <button 
                  onClick={handleSkipQuestion}
                  className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
                >
                  Skip this question →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>;
  }

  // Render results
  if (step === 'results' && userCardData && geniusCardData) {
    const savingsDifference = Math.abs(geniusCardData.annual_saving - userCardData.annual_saving);
    return <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 pt-24">
          {/* Rest of existing results content */}
        </div>
      </div>;
  }

  // Loading state for results
  if (step === 'results' && (!userCardData || !geniusCardData)) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <Navigation />
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
          <p className="text-xl text-muted-foreground">Loading comparison results...</p>
        </div>
      </div>;
  }

  // Fallback - should not reach here
  console.log("=== Fallback Render ===", {
    step,
    hasUserCard: !!userCardData,
    hasGeniusCard: !!geniusCardData
  });
  return <div className="min-h-screen bg-background flex items-center justify-center">
      <Navigation />
      <div className="text-center max-w-md">
        <p className="text-xl text-muted-foreground mb-4">Something went wrong</p>
        <Button onClick={() => {
        setStep('select');
        setCurrentStep(0);
        setResponses({});
        setSelectedCard(null);
      }}>
          Start Over
        </Button>
      </div>
    </div>;
};
export default BeatMyCard;
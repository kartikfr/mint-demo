import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Sparkles, ArrowRight } from "lucide-react";

const CardGeniusCTA = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6 animate-pulse">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          
          {/* Heading */}
          <h2 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-gradient">
            Super Card Genius
          </h2>
          
          {/* Subheading */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 font-medium">
            AI Powered tool to find the best card for <span className="text-primary font-bold">YOU!</span>
          </p>
          
          {/* CTA Button */}
          <Button
            size="lg"
            onClick={() => navigate('/card-genius')}
            className="group text-lg px-8 py-6 h-auto shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Try Card Genius
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          
          {/* Trust indicator */}
          <p className="mt-6 text-sm text-muted-foreground">
            Get personalized recommendations in under 2 minutes
          </p>
        </div>
      </div>
    </section>
  );
};

export default CardGeniusCTA;

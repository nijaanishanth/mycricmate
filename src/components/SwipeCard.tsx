import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Trophy, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwipeCardProps {
  type: "player" | "team";
  name: string;
  image: string;
  location: string;
  distance: string;
  rating: number;
  role?: string;
  battingStyle?: string;
  bowlingStyle?: string;
  experience?: string;
  formats?: string[];
  teamName?: string;
  homeGround?: string;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

const SwipeCard = ({
  type,
  name,
  image,
  location,
  distance,
  rating,
  role,
  battingStyle,
  bowlingStyle,
  experience,
  formats = [],
  teamName,
  homeGround,
  onSwipeLeft,
  onSwipeRight,
}: SwipeCardProps) => {
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const isDragging = useRef(false);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    isDragging.current = true;
    startX.current = "touches" in e ? e.touches[0].clientX : e.clientX;
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging.current) return;
    const currentX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const offset = currentX - startX.current;
    setDragOffset(offset);
  };

  const handleDragEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    if (dragOffset > 100) {
      setSwipeDirection("right");
      setTimeout(() => {
        onSwipeRight();
        setSwipeDirection(null);
        setDragOffset(0);
      }, 300);
    } else if (dragOffset < -100) {
      setSwipeDirection("left");
      setTimeout(() => {
        onSwipeLeft();
        setSwipeDirection(null);
        setDragOffset(0);
      }, 300);
    } else {
      setDragOffset(0);
    }
  };

  const rotation = dragOffset * 0.1;
  const opacity = Math.max(0, 1 - Math.abs(dragOffset) / 300);

  return (
    <Card
      ref={cardRef}
      variant="swipe"
      className={cn(
        "w-full max-w-sm mx-auto select-none cursor-grab active:cursor-grabbing",
        swipeDirection === "right" && "swipe-right",
        swipeDirection === "left" && "swipe-left"
      )}
      style={{
        transform: `translateX(${dragOffset}px) rotate(${rotation}deg)`,
        opacity: swipeDirection ? undefined : opacity,
      }}
      onMouseDown={handleDragStart}
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      onTouchStart={handleDragStart}
      onTouchMove={handleDragMove}
      onTouchEnd={handleDragEnd}
    >
      {/* Swipe indicators */}
      <div
        className={cn(
          "absolute top-6 left-6 z-10 px-4 py-2 rounded-xl font-bold text-lg border-4 border-swipe-like text-swipe-like rotate-[-15deg] transition-opacity duration-200",
          dragOffset > 50 ? "opacity-100" : "opacity-0"
        )}
      >
        LIKE
      </div>
      <div
        className={cn(
          "absolute top-6 right-6 z-10 px-4 py-2 rounded-xl font-bold text-lg border-4 border-swipe-pass text-swipe-pass rotate-[15deg] transition-opacity duration-200",
          dragOffset < -50 ? "opacity-100" : "opacity-0"
        )}
      >
        PASS
      </div>

      {/* Image */}
      <div className="relative h-80 overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-transparent" />
        
        {/* Rating badge */}
        <div className="absolute top-4 right-4 glass rounded-full px-3 py-1 flex items-center gap-1">
          <Star className="w-4 h-4 text-secondary fill-secondary" />
          <span className="font-semibold text-sm">{rating.toFixed(1)}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        <div>
          <h3 className="font-display font-bold text-2xl">{name}</h3>
          {type === "player" && role && (
            <p className="text-primary font-semibold">{role}</p>
          )}
          {type === "team" && teamName && (
            <p className="text-primary font-semibold">{teamName}</p>
          )}
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">{location}</span>
          <span className="text-muted-foreground/50">•</span>
          <span className="text-sm">{distance}</span>
        </div>

        {type === "player" && (
          <div className="space-y-2">
            {battingStyle && (
              <div className="flex items-center gap-2 text-sm">
                <Trophy className="w-4 h-4 text-secondary" />
                <span>{battingStyle}</span>
              </div>
            )}
            {bowlingStyle && (
              <div className="flex items-center gap-2 text-sm">
                <Trophy className="w-4 h-4 text-primary" />
                <span>{bowlingStyle}</span>
              </div>
            )}
            {experience && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{experience}</span>
              </div>
            )}
          </div>
        )}

        {type === "team" && homeGround && (
          <div className="flex items-center gap-2 text-sm">
            <Trophy className="w-4 h-4 text-primary" />
            <span>{homeGround}</span>
          </div>
        )}

        {formats.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formats.map((format) => (
              <Badge key={format} variant="secondary" className="rounded-full">
                {format}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default SwipeCard;

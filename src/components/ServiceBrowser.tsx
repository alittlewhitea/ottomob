"use client";

import { useMemo, useState } from "react";
import {
  AtSign,
  BarChart3,
  Eye,
  Heart,
  MessageCircle,
  Send,
  ThumbsUp,
  Users,
} from "lucide-react";

type Service = {
  id: number;
  platform: string;
  name: string;
  rate: number;
  minQuantity: number;
  maxQuantity: number;
  quantityStep: number;
};

const tabs = ["Instagram", "TikTok", "YouTube", "Facebook", "Telegram", "Twitter/X"];

const fallbackServices: Service[] = [
  { id: 1, platform: "Instagram", name: "Instagram Followers", rate: 2.19, minQuantity: 500, maxQuantity: 10000, quantityStep: 500 },
  { id: 2, platform: "Instagram", name: "Instagram Likes", rate: 1.99, minQuantity: 100, maxQuantity: 5000, quantityStep: 100 },
  { id: 3, platform: "Instagram", name: "IG Reels Views", rate: 1.49, minQuantity: 500, maxQuantity: 50000, quantityStep: 500 },
  { id: 4, platform: "Instagram", name: "IG Comments", rate: 4.5, minQuantity: 10, maxQuantity: 1000, quantityStep: 10 },
  { id: 5, platform: "TikTok", name: "TikTok Followers", rate: 3.4, minQuantity: 500, maxQuantity: 15000, quantityStep: 500 },
  { id: 6, platform: "YouTube", name: "YouTube Subscribers", rate: 6.9, minQuantity: 500, maxQuantity: 10000, quantityStep: 500 },
];

const iconMatchers = [
  { pattern: /followers|members|subscribers/i, icon: Users },
  { pattern: /likes|reactions/i, icon: Heart },
  { pattern: /views|watch/i, icon: Eye },
  { pattern: /comments|replies/i, icon: MessageCircle },
  { pattern: /shares|reposts/i, icon: Send },
  { pattern: /impressions|reach/i, icon: BarChart3 },
  { pattern: /mentions/i, icon: AtSign },
];

function iconFor(name: string) {
  return iconMatchers.find((item) => item.pattern.test(name))?.icon ?? ThumbsUp;
}

export function ServiceBrowser({ initialServices }: { initialServices: Service[] }) {
  const [activePlatform, setActivePlatform] = useState("Instagram");
  const loadedFromDb = initialServices.length > 0;
  const services = loadedFromDb ? initialServices : fallbackServices;

  const visibleServices = useMemo(
    () => services.filter((service) => service.platform === activePlatform),
    [activePlatform, services],
  );

  return (
    <>
      <div className="serviceTabs" role="tablist" aria-label="Service categories">
        {tabs.map((tab) => (
          <button
            className={activePlatform === tab ? "active" : ""}
            key={tab}
            onClick={() => setActivePlatform(tab)}
            role="tab"
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="catalogNote">
        {loadedFromDb
          ? "Showing filtered lowest-rate services synced from the supplier catalog."
          : "Preview catalog shown until you run the supplier sync."}
      </div>
      <div className="serviceLinkGrid">
        {visibleServices.map((service) => {
          const Icon = iconFor(service.name);
          return (
            <a href={loadedFromDb ? `/services/${service.id}` : "#services"} key={`${service.platform}-${service.id}`}>
              <Icon size={28} />
              <span>{service.name}</span>
              <small>
                from ${service.rate.toFixed(2)} / min {service.minQuantity}
              </small>
            </a>
          );
        })}
      </div>
    </>
  );
}

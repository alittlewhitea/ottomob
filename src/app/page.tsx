import {
  AtSign,
  BadgeCheck,
  BarChart3,
  Clock3,
  Eye,
  Grid3X3,
  Heart,
  LockKeyhole,
  Menu,
  MessageCircle,
  Search,
  Send,
  ShieldCheck,
  ShoppingCart,
  Star,
  ThumbsUp,
  Users,
  Zap,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { ServiceBrowser } from "@/components/ServiceBrowser";
import { catalogService } from "@/modules/services/catalog.service";

const platforms = [
  { name: "YouTube", short: "YT", className: "youtube" },
  { name: "Instagram", short: "IG", className: "instagram" },
  { name: "Facebook", short: "f", className: "facebook" },
  { name: "TikTok", short: "TT", className: "tiktok" },
  { name: "Telegram", short: "TG", className: "telegram" },
  { name: "Twitter/X", short: "X", className: "twitter" },
];

const popularServices = [
  {
    title: "Instagram Followers",
    price: "$2.19",
    tag: "Profile growth",
    icon: Users,
    tone: "pink",
  },
  {
    title: "TikTok Views",
    price: "$1.49",
    tag: "Video reach",
    icon: Eye,
    tone: "dark",
  },
  {
    title: "YouTube Subscribers",
    price: "$6.90",
    tag: "Channel boost",
    icon: Star,
    tone: "red",
  },
  {
    title: "Telegram Members",
    price: "$3.25",
    tag: "Community",
    icon: Send,
    tone: "blue",
  },
];

const advantages = [
  {
    title: "Privacy & Discretion",
    text: "Orders are handled with account details kept limited to what the service needs.",
    icon: LockKeyhole,
  },
  {
    title: "Risk-Aware Delivery",
    text: "Clear service notes help you choose steady delivery speeds and suitable quantities.",
    icon: ShieldCheck,
  },
  {
    title: "24/7 Support Desk",
    text: "Support workflows are reserved for tickets, order checks, and delivery questions.",
    icon: Clock3,
  },
  {
    title: "Service Guarantee",
    text: "Each service can include its own refill window, start time, and quality notes.",
    icon: BadgeCheck,
  },
  {
    title: "Higher Quality Results",
    text: "The catalog is organized around practical growth goals instead of noisy bundles.",
    icon: Zap,
  },
  {
    title: "Convenient Order Flow",
    text: "The future checkout will keep service choice, link, quantity, and payment in one flow.",
    icon: ShoppingCart,
  },
];

const faqs = [
  {
    q: "Do I need to share a password?",
    a: "No. Most services only need a public post, profile, channel, or group link.",
  },
  {
    q: "When will orders start?",
    a: "Start times depend on the selected service. The final catalog will show estimated timing before checkout.",
  },
  {
    q: "Is this connected to AmazingSMM yet?",
    a: "Not in this first phase. The API files are reserved for later service sync, ordering, status, and balance checks.",
  },
];

export default async function Home() {
  const [user, services] = await Promise.all([
    getCurrentUser(),
    catalogService.listByPlatform().catch(() => []),
  ]);

  return (
    <main>
      <FloatingHeader userName={user?.name ?? user?.email ?? null} />
      <section className="hero" id="top">
        <div className="heroInner">
          <p className="eyebrow">SMM service marketplace</p>
          <h1>OttoMob</h1>
          <h2>Social Media Marketing Marketplace</h2>
          <p className="heroCopy">
            Browse focused growth services for followers, likes, views, subscribers,
            comments, and everyday engagement across the platforms your customers use.
          </p>

          <div className="platformSelector" aria-label="Select SMM service">
            <span>Select SMM service:</span>
            <div className="platformIcons">
              {platforms.map((platform) => (
                <a href="#services" className={`platformIcon ${platform.className}`} key={platform.name}>
                  <span>{platform.short}</span>
                </a>
              ))}
            </div>
          </div>

          <a className="primaryCta" href="#all-services">
            All Services
          </a>
        </div>
      </section>

      <PaymentStrip />
      <PopularServices />
      <AllServices services={services} />
      <Advantages />
      <FaqSection />
      <Footer />
    </main>
  );
}

function FloatingHeader({ userName }: { userName: string | null }) {
  return (
    <header className="siteHeader">
      <a className="brand" href="#top" aria-label="OttoMob home">
        <span className="brandMark" aria-hidden="true">
          {Array.from({ length: 18 }).map((_, index) => (
            <i key={index} />
          ))}
        </span>
        <span>OttoMob</span>
      </a>

      <a className="allServicesButton" href="#all-services">
        <Grid3X3 size={20} />
        All Services
      </a>

      <nav className="mainNav" aria-label="Main navigation">
        <a href="#faq">FAQ</a>
        <a href="#advantages">About Us</a>
        <a href="#footer">Contact us</a>
      </nav>

      <div className="headerActions" aria-label="Shop actions">
        <button aria-label="Favorites">
          <Heart />
        </button>
        <button aria-label="Cart">
          <ShoppingCart />
        </button>
        <button aria-label="Search">
          <Search />
        </button>
      </div>

      <a className="accountLink" href={userName ? "/account" : "/login"}>
        {userName ? "Account" : "Sign in"}
      </a>

      <button className="mobileMenu" aria-label="Open menu">
        <Menu />
      </button>
    </header>
  );
}

function PaymentStrip() {
  return (
    <section className="paymentSection" aria-label="Payment methods preview">
      <div className="paymentPills">
        {["VISA", "Pay", "MC", "G Pay", "BTC", "ETH"].map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </section>
  );
}

function PopularServices() {
  return (
    <section className="section patterned" id="services">
      <div className="sectionHeader">
        <h2>
          Offers for <span>Instagram Promotion</span>
        </h2>
      </div>

      <div className="popularGrid">
        {popularServices.map((service) => {
          const Icon = service.icon;
          return (
            <article className="popularCard" key={service.title}>
              <div className={`serviceVisual ${service.tone}`}>
                <Icon size={54} />
                <small>{service.tag}</small>
              </div>
              <h3>{service.title}</h3>
              <div className="priceRow">
                <span>
                  from <b>{service.price}</b>
                </span>
                <a href="#all-services">Try Now</a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function AllServices({
  services,
}: {
  services: Awaited<ReturnType<typeof catalogService.listByPlatform>>;
}) {
  return (
    <section className="section allServices" id="all-services">
      <div className="sectionHeader">
        <h2>All Services</h2>
      </div>
      <ServiceBrowser initialServices={services} />
    </section>
  );
}

function Advantages() {
  return (
    <section className="section patterned advantages" id="advantages">
      <div className="sectionHeader">
        <h2>Our Advantages</h2>
      </div>
      <div className="advantagesGrid">
        {advantages.map((item) => {
          const Icon = item.icon;
          return (
            <article className="advantageItem" key={item.title}>
              <Icon size={58} />
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          );
        })}
      </div>
      <a className="softButton" href="#faq">
        Read More FAQ
      </a>
    </section>
  );
}

function FaqSection() {
  return (
    <section className="section faq" id="faq">
      <div className="sectionHeader">
        <h2>FAQ</h2>
      </div>
      <div className="faqList">
        {faqs.map((item) => (
          <details key={item.q}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer" id="footer">
      <div>
        <strong>OttoMob</strong>
        <p>Social growth services catalog for agencies, creators, and ecommerce teams.</p>
      </div>
      <nav aria-label="Footer navigation">
        <a href="#services">Services</a>
        <a href="#advantages">About Us</a>
        <a href="#faq">FAQ</a>
        <a href="mailto:support@example.com">Contact</a>
      </nav>
    </footer>
  );
}

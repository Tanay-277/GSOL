import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Nav } from "@/features/root/nav-bar";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Brain,
  CheckCircle,
  Glasses,
  Globe,
  GraduationCap,
  MessageSquare,
  Rocket,
  Target,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    title: "AI-Powered Learning",
    description: "Personalized learning paths adapted to your pace and style.",
    icon: Brain,
    className: "lg:col-span-2",
  },
  {
    title: "Progress Tracking",
    description: "Real-time insights into your learning journey with detailed analytics.",
    icon: Target,
    className: "lg:row-span-2",
  },
  {
    title: "Interactive Sessions",
    description: "Engage with AI tutors for immediate feedback and guidance.",
    icon: MessageSquare,
  },
  {
    title: "Smart Assessment",
    description: "Adaptive testing that grows with you and identifies knowledge gaps.",
    icon: Zap,
  },
  {
    title: "Collaborative Learning",
    description: "Connect with peers and learn together in virtual study groups.",
    icon: Users,
    className: "lg:col-span-2",
  },
];

const testimonials = [
  {
    quote:
      "MindWave completely transformed how I approach learning. The AI-powered recommendations helped me master concepts I struggled with for years.",
    name: "Sarah Johnson",
    title: "Computer Science Student",
  },
  {
    quote:
      "The personalized study plans saved me countless hours. I've achieved more in 3 months than I did in a year of traditional studying.",
    name: "Michael Chen",
    title: "MBA Candidate",
  },
  {
    quote:
      "As an educator, I'm impressed by how MindWave adapts to different learning styles. It's like having a personal tutor for each student.",
    name: "Dr. Emily Rodriguez",
    title: "University Professor",
  },
];

const benefits = [
  "Learn at your own pace with personalized AI guidance",
  "Track progress with detailed analytics and insights",
  "Access to thousands of courses across multiple disciplines",
  "Connect with a global community of learners",
  "Earn verifiable certificates for completed courses",
  "24/7 access from any device, anywhere in the world",
];

const accordionData = [
  {
    value: "item-1",
    question: "How does AI personalize my learning?",
    answer:
      "Our AI analyzes your learning style, pace, and preferences to create a customized curriculum that adapts in real-time to your progress and needs. It identifies knowledge gaps and recommends content that helps you master difficult concepts faster.",
  },
  {
    value: "item-2",
    question: "What subjects are available?",
    answer:
      "We offer a wide range of subjects including mathematics, sciences, languages, programming, business, arts, and humanities. Our AI-powered platform is constantly expanding its knowledge base with new courses and materials.",
  },
  {
    value: "item-3",
    question: "How much does it cost?",
    answer:
      "We offer flexible pricing plans starting with a free tier that gives you access to essential features. Premium features are available through our monthly ($19.99/month) or annual subscription plans ($199/year, saving you 17%).",
  },
  {
    value: "item-4",
    question: "Can I track my progress?",
    answer:
      "Yes, our platform provides detailed analytics and progress tracking. You can monitor your learning journey, set goals, review your performance metrics, identify trends in your studying habits, and receive regular progress reports.",
  },
  {
    value: "item-5",
    question: "Is there a mobile app available?",
    answer:
      "Yes, our mobile app is available for both iOS and Android devices. You can seamlessly switch between devices while maintaining your progress and preferences.",
  },
  {
    value: "item-6",
    question: "How do I get started?",
    answer:
      "Simply sign up for a free account, complete a brief assessment to help our AI understand your learning style, and you'll receive personalized course recommendations. You can start learning immediately after signup.",
  },
];

const footerLinks = [
  {
    title: "Product",
    links: [
      { name: "Features", href: "#features" },
      { name: "Pricing", href: "/pricing" },
      { name: "API", href: "#" },
      { name: "Integrations", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { name: "About", href: "#" },
      { name: "Blog", href: "#" },
      { name: "Careers", href: "#" },
      { name: "Press", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { name: "Documentation", href: "#" },
      { name: "Help Center", href: "#" },
      { name: "Community", href: "#" },
      { name: "Webinars", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { name: "Privacy", href: "#" },
      { name: "Terms", href: "#" },
      { name: "Cookie Policy", href: "#" },
      { name: "Data Processing", href: "#" },
    ],
  },
];

export default function Home() {
  return (
    <div className="min-h-screen font-geistSans">
      <Nav />

      {/* Hero Section */}
      <div className="relative mx-auto flex min-h-[90vh] max-w-7xl flex-col overflow-hidden px-4 pt-20 sm:px-6 md:pt-20 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div className="flex flex-col justify-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              Empowering Your Learning Journey with{" "}
              <span className="bg-gradient-to-b from-[#CB92FF] to-[#9333EA] bg-clip-text font-extrabold text-transparent">
                AI
              </span>
              ⚡
            </h1>
            <p className="mt-6 max-w-3xl text-lg text-muted-foreground">
              Tailored courses, smarter insights, and accelerated growth through the power of
              artificial intelligence.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link passHref href="/signin">
                <Button className="flex items-center gap-2 py-6" size="lg">
                  Get started for free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="outline" className="flex items-center gap-2 py-6" size="lg">
                Watch demo
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="inline-block h-8 w-8 rounded-full border-2 border-background bg-primary/20"
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold">5,000+</span> students already learning
              </p>
            </div>
          </div>
          <div className="relative mt-8 md:mt-0">
            <div className="relative rounded-[32px] border border-border bg-muted/50 p-2 md:h-[450px]">
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 w-full scale-[1.1]" />
              <div className="h-full rounded-[24px] border border-border bg-background p-2">
                <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl bg-muted/30">
                  <Rocket className="h-12 w-12 text-primary" />
                  <p className="mt-4 text-sm text-muted-foreground">Interactive demo placeholder</p>
                </div>
              </div>
            </div>
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/10 blur-xl" />
            <div className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-purple-500/10 blur-xl" />
          </div>
        </div>
      </div>

      {/* Logos Section */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="mb-8 text-center text-sm font-medium text-muted-foreground">
          TRUSTED BY LEADING INSTITUTIONS WORLDWIDE
        </p>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="flex h-12 items-center justify-center rounded-md border border-border bg-background/50 px-6 backdrop-blur-sm"
            >
              <div className="h-5 w-20 rounded bg-muted/50" />
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8" id="features">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-5xl">
            Everything you need to excel
          </h2>
          <p className="mx-auto mt-6 max-w-3xl text-center text-lg text-muted-foreground">
            Comprehensive features designed to enhance your learning experience and help you achieve
            your goals faster.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              title={feature.title}
              description={feature.description}
              icon={<feature.icon className="h-8 w-8 text-primary" />}
              className={feature.className}
            />
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="mb-6 text-3xl font-bold text-foreground md:text-4xl">
              Transform the way you learn with MindWave
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Our AI-powered learning platform adapts to your unique needs, making education more
              efficient, engaging, and effective than ever before.
            </p>
            <ul className="space-y-4">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                  <span className="text-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Link href="/signin" passHref>
                <Button className="flex items-center gap-2" size="lg">
                  Start your journey
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative rounded-[32px] border border-border bg-muted/50 p-2">
            <div className="h-[400px] rounded-[24px] border border-border bg-background p-2">
              <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl bg-muted/30">
                <GraduationCap className="h-12 w-12 text-primary" />
                <p className="mt-4 text-sm text-muted-foreground">
                  Learning stats visualization placeholder
                </p>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 h-32 w-32 rounded-full bg-primary/10 blur-xl" />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-muted/30 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-5xl">
              Loved by learners worldwide
            </h2>
            <p className="mx-auto mt-6 max-w-3xl text-center text-lg text-muted-foreground">
              Join thousands of students who have transformed their learning experience with
              MindWave.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="relative rounded-xl border border-border bg-background p-6 shadow-sm"
              >
                <div className="mb-4 text-primary">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className="text-lg">
                      ★
                    </span>
                  ))}
                </div>
                <p className="mb-6 text-foreground">&quot;{testimonial.quote}&quot;</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/20" />
                  <div>
                    <p className="font-medium text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-5xl">
            Frequently asked questions
          </h2>
          <p className="mx-auto text-lg text-muted-foreground">
            Everything you need to know about our AI-powered learning platform
          </p>
        </div>

        <div className="mx-auto max-w-3xl">
          <Accordion type="single" collapsible className="w-full">
            {accordionData.map((item) => (
              <AccordionItem
                value={item.value}
                key={item.value}
                className="border bg-background/10 px-4 py-1 backdrop-blur-md first:rounded-t-lg last:rounded-b-lg"
              >
                <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
                <AccordionContent>{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-24 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="mb-4 text-3xl font-bold md:text-5xl">
                Ready to transform your learning?
              </h2>
              <p className="mb-8 text-xl text-primary-foreground/90">
                Join thousands of learners who are already experiencing the future of education.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link href="/signin" passHref>
                  <Button size="lg" variant="secondary" className="hover:bg-secondary/90">
                    Get started for free
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
                >
                  Schedule a demo
                </Button>
              </div>
            </div>
            <div className="relative rounded-[32px] border border-primary-foreground/20 bg-primary-foreground/5 p-2">
              <div className="relative h-[300px] rounded-[24px] border border-primary-foreground/20 bg-primary-foreground/5 p-2">
                <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl">
                  <Globe className="h-12 w-12 text-primary-foreground/80" />
                  <p className="mt-4 text-sm text-primary-foreground/80">
                    Join our global learning community
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
            <div className="col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                  <Glasses className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">MindWave</span>
              </div>
              <p className="mt-4 max-w-xs text-sm text-muted-foreground">
                Transforming education through AI-powered personalized learning experiences.
              </p>
              <div className="mt-6 flex space-x-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-muted"
                  />
                ))}
              </div>
            </div>
            {footerLinks.map((column, index) => (
              <div key={index}>
                <h3 className="text-sm font-semibold text-foreground">{column.title}</h3>
                <ul className="mt-4 space-y-2">
                  {column.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-primary"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 border-t border-border pt-8">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <p className="text-center text-sm text-muted-foreground">
                © {new Date().getFullYear()} MindWave | All rights reserved
              </p>
              <div className="flex space-x-6">
                <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
                  Privacy Policy
                </Link>
                <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
                  Terms of Service
                </Link>
                <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
                  Cookie Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  className?: string;
}

function FeatureCard({ title, description, icon, className }: FeatureCardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-xl border border-border bg-background p-6 shadow-sm backdrop-blur-md transition-all hover:shadow-md",
        className,
      )}
    >
      <div className="relative mb-4 inline-block rounded-lg bg-primary/10 p-3">
        {icon}
        <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-primary/50" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-primary/50 transition-opacity group-hover:ring-primary/70" />
    </div>
  );
}

import CustomCursor from "@/components/ui/CustomCursor";
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
  MessageSquare,
  Target,
  Users,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const features = [
  {
    title: "AI-Powered Learning",
    description: "Personalized learning paths adapted to your pace and style",
    icon: Brain,
    className: "lg:col-span-2",
  },
  {
    title: "Progress Tracking",
    description: "Real-time insights into your learning journey",
    icon: Target,
    className: "lg:row-span-2",
  },
  {
    title: "Interactive Sessions",
    description: "Engage with AI tutors for immediate feedback",
    icon: MessageSquare,
  },
  {
    title: "Smart Assessment",
    description: "Adaptive testing that grows with you",
    icon: Zap,
  },
  {
    title: "Collaborative Learning",
    description: "Connect with peers and learn together",
    icon: Users,
    className: "lg:col-span-2",
  },
];

const accordionData = [
  {
    value: "item-1",
    question: "How does AI personalize my learning?",
    answer:
      "Our AI analyzes your learning style, pace, and preferences to create a customized curriculum that adapts in real-time to your progress and needs.",
  },
  {
    value: "item-2",
    question: "What subjects are available?",
    answer:
      "We offer a wide range of subjects including mathematics, sciences, languages, programming, and more. Our AI-powered platform is constantly expanding its knowledge base.",
  },
  {
    value: "item-3",
    question: "How much does it cost?",
    answer:
      "We offer flexible pricing plans starting with a free tier. Premium features are available through our monthly or annual subscription plans.",
  },
  {
    value: "item-4",
    question: "Can I track my progress?",
    answer:
      "Yes, our platform provides detailed analytics and progress tracking. You can monitor your learning journey, set goals, and receive regular progress reports.",
  },
];

const footerLinks = [
  {
    title: "Product",
    links: [
      { name: "Features", href: "#" },
      { name: "Pricing", href: "#" },
      { name: "API", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { name: "About", href: "#" },
      { name: "Blog", href: "#" },
      { name: "Careers", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { name: "Documentation", href: "#" },
      { name: "Help Center", href: "#" },
      { name: "Community", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { name: "Privacy", href: "#" },
      { name: "Terms", href: "#" },
      { name: "Cookie Policy", href: "#" },
    ],
  },
];

export default function Hero() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-orange-50 to-transparent font-geistSans">
      <Nav />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col overflow-hidden px-4 pt-20 sm:px-6 md:pt-40 lg:px-8">
        <h1 className="relative z-10 mx-auto mt-6 max-w-6xl text-center text-4xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl">
          Empowering Your Learning Journey with{" "}
          <span className="bg-gradient-to-b from-[#CB92FF] to-[#9333EA] bg-clip-text font-extrabold text-transparent">
            AI
          </span>
          ⚡
        </h1>
        <p className="relative z-10 mx-auto mt-6 max-w-3xl text-center text-base text-muted-foreground md:text-xl">
          Tailored Courses, Smarter Insights, Faster Growth
        </p>
        <div className="relative z-10 mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link passHref href="/signin">
            {" "}
            <Button className="flex items-center gap-2 py-6" size="lg">
              Get started for free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="outline"
            className="flex items-center gap-2 py-6"
            size="lg"
          >
            Watch demo
          </Button>
        </div>
        <div className="relative mt-20 rounded-[32px] border border-border bg-muted/50 p-2">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 w-full scale-[1.1]" />
          <div className="rounded-[24px] border border-border bg-background p-2">
            <Image
              alt="header"
              loading="lazy"
              width={1920}
              height={1080}
              decoding="async"
              className="rounded-[20px]"
              src="https://res.cloudinary.com/sutharjay/image/upload/v1736580152/hssx9lbus911vzdq0izj.png"
            />
          </div>
        </div>
      </div>

      <section
        className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8"
        id="features"
      >
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-5xl">
            Everything you need to excel
          </h2>
          <p className="relative z-10 mx-auto mt-6 max-w-3xl text-center text-base text-muted-foreground md:text-xl">
            Comprehensive features designed to enhance your learning experience
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-5xl">
            Frequently asked questions
          </h2>
          <p className="text-muted-foreground">
            Everything you need to know about our AI-powered learning platform
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {accordionData.map((item) => (
            <AccordionItem
              value={item.value}
              key={item.value}
              className="border bg-background/10 px-4 py-1 backdrop-blur-md first:rounded-t-lg last:rounded-b-lg"
            >
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent>{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section className="bg-primary py-24 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center gap-8 lg:flex-row">
            <div className="mx-auto text-center lg:text-left">
              <h2 className="mb-4 text-3xl font-bold md:text-5xl">
                Ready to transform your learning?
              </h2>
              <p className="mb-8 text-lg text-primary-foreground/90">
                Join thousands of learners who are already experiencing the
                future of education.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button
                  size="lg"
                  variant="secondary"
                  className="hover:bg-secondary/90"
                >
                  Get started for free
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  className="hover:bg-secondary/90"
                >
                  Schedule a demo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 place-items-center gap-8 md:grid-cols-4">
            {footerLinks.map((column, index) => (
              <div key={index}>
                <h3 className="text-sm font-semibold text-foreground">
                  {column.title}
                </h3>
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
            <p className="text-center text-sm text-muted-foreground">
              © {new Date().getFullYear()} 󠁯•󠁏 Progresso AI | All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>

      <CustomCursor color="#9333EA50" glow={true} size={20} duration={0.5} />
    </div>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  className?: string;
}

function FeatureCard({
  title,
  description,
  icon,
  className,
}: FeatureCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-xl border border-border bg-background p-6 backdrop-blur-md",
        className,
      )}
    >
      <div className="relative mb-4 inline-block rounded-lg bg-primary/10 p-2">
        {icon}
        <div className="absolute rounded-lg ring-1 ring-inset ring-primary/50" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="absolute rounded-xl ring-1 ring-inset ring-primary/50" />
    </div>
  );
}

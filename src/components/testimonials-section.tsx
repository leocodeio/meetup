"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, Quote } from "lucide-react";
import { useTranslations } from "next-intl";

const stats = [
  { labelKey: "stats.activeDevelopers", value: "10,000+" },
  { labelKey: "stats.appsBuilt", value: "50,000+" },
  { labelKey: "stats.countries", value: "120+" },
  { labelKey: "stats.uptime", value: "99.9%" }
];

export function TestimonialsSection() {
  const t = useTranslations("Testimonials");

  const testimonials = [
    {
      name: t("items.0.name"),
      role: t("items.0.role"),
      company: t("items.0.company"),
      avatar: "/placeholder-user.jpg",
      content: t("items.0.content"),
      rating: 5,
      featured: true
    },
    {
      name: t("items.1.name"),
      role: t("items.1.role"),
      company: t("items.1.company"),
      avatar: "/placeholder-user.jpg",
      content: t("items.1.content"),
      rating: 5,
      featured: false
    },
    {
      name: t("items.2.name"),
      role: t("items.2.role"),
      company: t("items.2.company"),
      avatar: "/placeholder-user.jpg",
      content: t("items.2.content"),
      rating: 5,
      featured: false
    },
    {
      name: t("items.3.name"),
      role: t("items.3.role"),
      company: t("items.3.company"),
      avatar: "/placeholder-user.jpg",
      content: t("items.3.content"),
      rating: 5,
      featured: false
    },
    {
      name: t("items.4.name"),
      role: t("items.4.role"),
      company: t("items.4.company"),
      avatar: "/placeholder-user.jpg",
      content: t("items.4.content"),
      rating: 5,
      featured: false
    },
    {
      name: t("items.5.name"),
      role: t("items.5.role"),
      company: t("items.5.company"),
      avatar: "/placeholder-user.jpg",
      content: t("items.5.content"),
      rating: 5,
      featured: false
    }
  ];

  return (
    <section id="testimonials" className="py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Badge variant="outline" className="mb-4">
            {t("badge")}
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {t("heading")}{" "}
            <span className="text-primary">{t("headingHighlight")}</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t("description")}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">
                {t(stat.labelKey)}
              </div>
            </div>
          ))}
        </div>

        <div className="mb-16">
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-8 lg:p-12">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
                <div className="flex-1">
                  <Quote className="h-8 w-8 text-primary mb-4" />
                  <blockquote className="text-xl lg:text-2xl font-medium mb-6 leading-relaxed">
                    &ldquo;{testimonials[0].content}&rdquo;
                  </blockquote>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={testimonials[0].avatar} alt={testimonials[0].name} />
                      <AvatarFallback>{testimonials[0].name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">{testimonials[0].name}</div>
                      <div className="text-sm text-muted-foreground">{testimonials[0].role}</div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.slice(1).map((testimonial, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= testimonial.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
                <blockquote className="text-muted-foreground mb-4">
                  &ldquo;{testimonial.content}&rdquo;
                </blockquote>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                    <AvatarFallback>
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-sm">{testimonial.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {testimonial.role} at {testimonial.company}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground mb-8">
            {t("trustIndicator")}
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <div className="text-2xl font-bold">TechCorp</div>
            <div className="text-2xl font-bold">StartupXYZ</div>
            <div className="text-2xl font-bold">InnovateLabs</div>
            <div className="text-2xl font-bold">CodeMasters</div>
            <div className="text-2xl font-bold">ScaleUp Inc</div>
          </div>
        </div>
      </div>
    </section>
  );
}

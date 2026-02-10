"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap } from "lucide-react";

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);
  const t = useTranslations("Pricing");

  const pricingPlans = [
    {
      name: t("plans.starter.name"),
      description: t("plans.starter.description"),
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        t("plans.starter.features.projects"),
        t("plans.starter.features.auth"),
        t("plans.starter.features.support"),
        t("plans.starter.features.storage"),
        t("plans.starter.features.analytics"),
        t("plans.starter.features.email")
      ],
      limitations: [
        t("plans.starter.limitations.api"),
        t("plans.starter.limitations.domains"),
        t("plans.starter.limitations.templates")
      ],
      popular: false,
      cta: t("plans.starter.cta")
    },
    {
      name: t("plans.pro.name"),
      description: t("plans.pro.description"),
      monthlyPrice: 29,
      yearlyPrice: 290,
      features: [
        t("plans.pro.features.projects"),
        t("plans.pro.features.auth"),
        t("plans.pro.features.support"),
        t("plans.pro.features.storage"),
        t("plans.pro.features.analytics"),
        t("plans.pro.features.domains"),
        t("plans.pro.features.apiLimits"),
        t("plans.pro.features.collaboration"),
        t("plans.pro.features.integrations")
      ],
      limitations: [],
      popular: true,
      cta: t("plans.pro.cta")
    },
    {
      name: t("plans.enterprise.name"),
      description: t("plans.enterprise.description"),
      monthlyPrice: 99,
      yearlyPrice: 990,
      features: [
        t("plans.enterprise.features.everything"),
        t("plans.enterprise.features.apiUnlimited"),
        t("plans.enterprise.features.dedicatedSupport"),
        t("plans.enterprise.features.unlimitedStorage"),
        t("plans.enterprise.features.advancedSecurity"),
        t("plans.enterprise.features.sla"),
        t("plans.enterprise.features.customDeployment"),
        t("plans.enterprise.features.whiteLabel"),
        t("plans.enterprise.features.advancedIntegrations"),
        t("plans.enterprise.features.phoneSupport")
      ],
      limitations: [],
      popular: false,
      cta: t("plans.enterprise.cta")
    }
  ];

  const faqs = [
    {
      question: t("faqs.changePlan.question"),
      answer: t("faqs.changePlan.answer")
    },
    {
      question: t("faqs.freeTrial.question"),
      answer: t("faqs.freeTrial.answer")
    },
    {
      question: t("faqs.paymentMethods.question"),
      answer: t("faqs.paymentMethods.answer")
    },
    {
      question: t("faqs.refunds.question"),
      answer: t("faqs.refunds.answer")
    }
  ];


  return (
    <section id="pricing" className="py-24 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
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

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-4 py-2 rounded-md transition-colors ${
                !isYearly ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {t("monthly")}
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-4 py-2 rounded-md transition-colors ${
                isYearly ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {t("yearly")}
            </button>
            <Badge variant="secondary" className="ml-2">
              {t("savePercent")}
            </Badge>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-8 lg:grid-cols-3 max-w-7xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <Card
              key={index}
              className={`relative ${
                plan.popular
                  ? "border-primary shadow-lg scale-105"
                  : "border-border"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1">
                    <Star className="h-3 w-3 mr-1" />
                    {t("mostPopular")}
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="mt-2">
                  {plan.description}
                </CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">
                    ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  {plan.monthlyPrice > 0 && (
                    <span className="text-muted-foreground ml-1">
                      /{isYearly ? t("year") : t("month")}
                    </span>
                  )}
                  {plan.monthlyPrice === 0 && (
                    <span className="text-muted-foreground ml-1">{t("forever")}</span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.limitations.length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">{t("limitations")}</p>
                    <ul className="space-y-2">
                      {plan.limitations.map((limitation, limitIndex) => (
                        <li key={limitIndex} className="flex items-center gap-3">
                          <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">
                            {limitation}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>

              <CardFooter>
                <Button
                  className={`w-full ${
                    plan.popular
                      ? "bg-primary hover:bg-primary/90"
                      : plan.monthlyPrice === 0
                      ? "bg-secondary hover:bg-secondary/80"
                      : ""
                  }`}
                  variant={plan.popular ? "default" : plan.monthlyPrice === 0 ? "secondary" : "outline"}
                >
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8">
            {t("faqTitle")}
          </h3>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <h4 className="font-semibold mb-2">{faq.question}</h4>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Enterprise CTA */}
        <div className="mt-16 text-center">
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 max-w-2xl mx-auto">
            <CardContent className="p-8">
              <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">{t("enterpriseCta.title")}</h3>
              <p className="text-muted-foreground mb-6">
                {t("enterpriseCta.description")}
              </p>
              <Button variant="outline" size="lg">
                {t("enterpriseCta.button")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

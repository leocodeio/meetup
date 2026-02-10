"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { HelpCircle, MessageCircle, Book, Users } from "lucide-react";
import { useTranslations } from "next-intl";

export function FAQSection() {
  const t = useTranslations("FAQ");

  const faqs = [
    { question: t("questions.q1.question"), answer: t("questions.q1.answer") },
    { question: t("questions.q2.question"), answer: t("questions.q2.answer") },
    { question: t("questions.q3.question"), answer: t("questions.q3.answer") },
    { question: t("questions.q4.question"), answer: t("questions.q4.answer") },
    { question: t("questions.q5.question"), answer: t("questions.q5.answer") },
    { question: t("questions.q6.question"), answer: t("questions.q6.answer") },
    { question: t("questions.q7.question"), answer: t("questions.q7.answer") },
    { question: t("questions.q8.question"), answer: t("questions.q8.answer") },
    { question: t("questions.q9.question"), answer: t("questions.q9.answer") },
    { question: t("questions.q10.question"), answer: t("questions.q10.answer") }
  ];

  const supportOptions = [
    {
      icon: MessageCircle,
      title: t("supportSection.options.community.title"),
      description: t("supportSection.options.community.description"),
      action: t("supportSection.options.community.action")
    },
    {
      icon: Book,
      title: t("supportSection.options.docs.title"),
      description: t("supportSection.options.docs.description"),
      action: t("supportSection.options.docs.action")
    },
    {
      icon: Users,
      title: t("supportSection.options.enterprise.title"),
      description: t("supportSection.options.enterprise.description"),
      action: t("supportSection.options.enterprise.action")
    },
    {
      icon: HelpCircle,
      title: t("supportSection.options.help.title"),
      description: t("supportSection.options.help.description"),
      action: t("supportSection.options.help.action")
    }
  ];

  return (
    <section id="faq" className="py-24 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <Badge variant="outline" className="mb-4">
            {t("badge")}
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {t("title")}{" "}
            <span className="text-primary">{t("titleHighlight")}</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        <div className="max-w-3xl mx-auto mb-16">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border rounded-lg px-6"
              >
                <AccordionTrigger className="text-left hover:no-underline py-6">
                  <span className="font-medium">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="pb-6 text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold mb-4">{t("supportSection.title")}</h3>
            <p className="text-muted-foreground">
              {t("supportSection.subtitle")}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {supportOptions.map((option, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="h-12 w-12 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center">
                    <option.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-semibold mb-2">{option.title}</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    {option.description}
                  </p>
                  <button className="text-sm text-primary hover:underline font-medium">
                    {option.action}
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="mt-16 text-center">
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-xl font-bold mb-2">{t("contactCta.title")}</h3>
              <p className="text-muted-foreground mb-6">
                {t("contactCta.description")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                  {t("contactCta.contactButton")}
                </button>
                <button className="px-6 py-2 border border-border rounded-md hover:bg-muted transition-colors">
                  {t("contactCta.scheduleButton")}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

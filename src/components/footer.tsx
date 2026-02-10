"use client";

import Link from "next/link";
import {
  Github,
  Twitter,
  Linkedin,
  // Mail,
  // MapPin,
  // Phone,
} from "lucide-react";
import { useTranslations } from "next-intl";
// import Image from "next/image";

const socialLinks = [
  { name: "GitHub", icon: Github, href: "https://github.com/leocodeio" },
  { name: "Twitter", icon: Twitter, href: "#" },
  { name: "LinkedIn", icon: Linkedin, href: "https://www.linkedin.com/in/sai-harsha-vardhan-pittada-8a9a74252/" }
];

export function Footer() {
  const t = useTranslations("Footer");

  const footerLinks = {
    product: [
      { name: t("links.product.items.0"), href: "#features" },
      { name: t("links.product.items.1"), href: "#pricing" },
      { name: t("links.product.items.2"), href: "#" },
      { name: t("links.product.items.3"), href: "#" },
      { name: t("links.product.items.4"), href: "#" }
    ],
    company: [
      { name: t("links.company.items.0"), href: "#" },
      { name: t("links.company.items.1"), href: "#" },
      { name: t("links.company.items.2"), href: "#" },
      { name: t("links.company.items.3"), href: "#" },
      { name: t("links.company.items.4"), href: "#" }
    ],
    support: [
      { name: t("links.support.items.0"), href: "#" },
      { name: t("links.support.items.1"), href: "#" },
      { name: t("links.support.items.2"), href: "#" },
      { name: t("links.support.items.3"), href: "#" },
      { name: t("links.support.items.4"), href: "#" }
    ],
    legal: [
      { name: t("links.legal.items.0"), href: "#" },
      { name: t("links.legal.items.1"), href: "#" },
      { name: t("links.legal.items.2"), href: "#" },
      { name: t("links.legal.items.3"), href: "#" },
      { name: t("links.legal.items.4"), href: "#" }
    ]
  };

  return (
    <footer className="bg-muted/30 border-t">
      {/* <div className="border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="mx-auto max-w-2xl text-center">
            <h3 className="text-2xl font-bold mb-2">{t("newsletter.title")}</h3>
            <p className="text-muted-foreground mb-8">
              {t("newsletter.description")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input
                type="email"
                placeholder={t("newsletter.placeholder")}
                className="flex-1"
              />
              <Button>
                {t("newsletter.button")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              {t("newsletter.privacy")}
            </p>
          </div>
        </div>
      </div> */}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12">
        {/* <div className="grid gap-8 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-6 group">
              <div className="h-10 w-10 relative transition-transform group-hover:scale-110">
                <Image
                  src="/favicon.ico"
                  alt="GitSprint Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="font-bold text-2xl tracking-tight">{t("company.name")}</span>
            </div>
            <p className="text-muted-foreground mb-6 max-w-sm">
              {t("company.description")}
            </p>

            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>{t("company.contact.email")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>{t("company.contact.phone")}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{t("company.contact.location")}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <h4 className="font-semibold mb-4">{t("links.product.title")}</h4>
              <ul className="space-y-2">
                {footerLinks.product.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">{t("links.company.title")}</h4>
              <ul className="space-y-2">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">{t("links.support.title")}</h4>
              <ul className="space-y-2">
                {footerLinks.support.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">{t("links.legal.title")}</h4>
              <ul className="space-y-2">
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div> */}

        {/* <div className="border-t my-8" /> */}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
            <span>{t("bottom.copyright")}</span>
            <div className="hidden sm:block w-px h-4 bg-border" />
            <span>{t("bottom.madeWith")}</span>
          </div>

          <div className="flex items-center gap-4 sm:gap-5">
            {socialLinks.map((social) => (
              <Link
                key={social.name}
                href={social.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label={t(`social.${social.name.toLowerCase()}`)}
              >
                <social.icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

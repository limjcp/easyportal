import { MarketingLayout } from "./MarketingLayout";
import { resolveMarketingPage } from "./navigation";
import { HomePage } from "./pages/HomePage";
import { InsideMvpPage } from "./pages/InsideMvpPage";
import { ContactUsPage } from "./pages/ContactUsPage";
import { FaqPage } from "./pages/FaqPage";
import { BetterBookkeepingPage } from "./pages/BetterBookkeepingPage";
import { ContractorsPage } from "./pages/ContractorsPage";
import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage";
import { OwnerBoardTipsPage } from "./pages/OwnerBoardTipsPage";
import { FreeConsultationPage } from "./pages/FreeConsultationPage";
import { VendorsPage } from "./pages/VendorsPage";
import { EbookPage } from "./pages/EbookPage";
import { CommonElementPage } from "./pages/CommonElementPage";
import { ComplianceDashboardPage } from "./pages/ComplianceDashboardPage";

type MarketingPortalProps = {
  pathname: string;
  onNavigate: (path: string) => void;
  onOpenLogin: () => void;
};

export function MarketingPortal({ pathname, onNavigate, onOpenLogin }: MarketingPortalProps) {
  const page = resolveMarketingPage(pathname);

  return (
    <MarketingLayout currentPage={page} onNavigate={onNavigate} onOpenLogin={onOpenLogin}>
      {page === "home" && <HomePage onNavigate={onNavigate} />}
      {page === "inside-mvp" && <InsideMvpPage onNavigate={onNavigate} />}
      {page === "contact-us" && <ContactUsPage onNavigate={onNavigate} />}
      {page === "faq" && <FaqPage onNavigate={onNavigate} />}
      {page === "better-bookkeeping" && <BetterBookkeepingPage onNavigate={onNavigate} />}
      {page === "compliance-dashboard" && <ComplianceDashboardPage onNavigate={onNavigate} />}
      {page === "contractors" && <ContractorsPage onNavigate={onNavigate} />}
      {page === "privacy-policy" && <PrivacyPolicyPage onNavigate={onNavigate} />}
      {page === "owner-and-board-tips" && <OwnerBoardTipsPage onNavigate={onNavigate} />}
      {page === "free-consultation" && <FreeConsultationPage onNavigate={onNavigate} />}
      {page === "vendors" && <VendorsPage onNavigate={onNavigate} />}
      {page === "ebook" && <EbookPage onNavigate={onNavigate} />}
      {page === "the-common-element" && <CommonElementPage onNavigate={onNavigate} />}
      {page === "home-1" && <HomePage onNavigate={onNavigate} />}
    </MarketingLayout>
  );
}


export type PrivacyPolicySubsection = {
  title?: string;
  paragraphs?: string[];
  bullets?: string[];
  definitions?: { term: string; definition: string }[];
};

export type PrivacyPolicySection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  subsections?: PrivacyPolicySubsection[];
};

export const privacyPolicyMeta = {
  title: "MVP Condominium Property Management (MVP Condos) Privacy Policy",
  lastUpdated: "January 17, 2026",
  intro: [
    "This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information when You use the Service and tells You about **Your privacy rights** and how the law protects You.",
    "We use Your **Personal Data** to provide and improve the Service. By using the Service, You agree to the collection and use of information in accordance with this Privacy Policy.",
    "This Privacy Policy is intended to comply with applicable **Canadian privacy legislation**, including the Personal Information Protection and Electronic Documents Act (PIPEDA) and applicable provincial privacy laws.",
  ],
};

export const privacyPolicySections: PrivacyPolicySection[] = [
  {
    title: "Interpretation and Definitions",
    subsections: [
      {
        title: "Interpretation",
        paragraphs: [
          "The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or plural.",
        ],
      },
      {
        title: "Definitions",
        paragraphs: ["For the purposes of this Privacy Policy:"],
        definitions: [
          { term: "Account", definition: "A unique account created for You to access our Service or parts of our Service." },
          {
            term: "Company",
            definition:
              'Referred to as "the Company", "We", "Us" or "Our", refers to MVP Condominium Property Management, 31 McBrine Dr, Unit 2, Kitchener, Ontario, N2R 1J1.',
          },
          { term: "Cookies", definition: "Small files placed on Your device containing browsing history details." },
          { term: "Country", definition: "Ontario, Canada." },
          { term: "Device", definition: "Any device that can access the Service." },
          { term: "Personal Data", definition: "Any information relating to an identified or identifiable individual." },
          { term: "Service", definition: "The Website." },
          { term: "Service Provider", definition: "Any third party that processes data on behalf of the Company." },
          {
            term: "Third-Party Social Media Service",
            definition: "Any website or social network allowing login or registration.",
          },
          { term: "Usage Data", definition: "Data collected automatically from Service usage." },
          { term: "Website", definition: "MVP Condos, accessible from https://www.mvpmgmt.ca/" },
          { term: "You", definition: "The individual or legal entity accessing the Service." },
        ],
      },
    ],
  },
  {
    title: "Collecting and Using Your Personal Data",
    subsections: [
      {
        title: "Types of Data Collected",
        paragraphs: [],
      },
      {
        title: "Personal Data",
        paragraphs: ["We may collect:"],
        bullets: ["Email address", "First and last name", "Phone number", "Address (City, Province, Postal Code)"],
      },
      {
        title: "Usage Data",
        paragraphs: ["Collected automatically and may include:"],
        bullets: [
          "IP address",
          "Browser type/version",
          "Pages visited",
          "Date/time of visits",
          "Time spent on pages",
          "Device identifiers",
          "Operating system",
        ],
      },
      {
        title: "Tracking Technologies and Cookies",
        paragraphs: [
          "We use Cookies and similar tracking technologies to monitor activity and improve our Service.",
          "Technologies include:",
        ],
        bullets: ["Cookies", "Flash Cookies", "Web beacons"],
      },
      {
        title: "Types of Cookies We Use",
        paragraphs: ["Cookies may be Session or Persistent cookies."],
        definitions: [
          { term: "Essential Cookies", definition: "Required to operate the Service." },
          { term: "Acceptance Cookies", definition: "Store cookie consent preferences." },
          { term: "Functionality Cookies", definition: "Remember user preferences." },
        ],
      },
      {
        paragraphs: [
          "You may refuse cookies through browser settings, but some features may not function.",
        ],
      },
      {
        title: "Use of Your Personal Data",
        paragraphs: ["We may use Personal Data to:"],
        bullets: [
          "Provide and maintain the Service",
          "Manage user accounts",
          "Fulfill contractual obligations",
          "Communicate service updates",
          "Send marketing communications (opt-out available)",
          "Manage requests",
          "Conduct business transfers",
          "Analyze and improve services",
        ],
      },
      {
        title: "Sharing Your Personal Data",
        paragraphs: ["We may share data:"],
        bullets: [
          "With Service Providers",
          "During business transactions",
          "With affiliates",
          "With business partners",
          "With other users (public areas)",
          "With your consent",
        ],
      },
      {
        title: "Retention of Data",
        paragraphs: ["We retain Personal Data only as long as necessary to:"],
        bullets: [
          "Fulfill purposes stated",
          "Meet legal obligations",
          "Resolve disputes",
          "Enforce agreements",
        ],
      },
      {
        title: "Transfer of Data",
        paragraphs: [
          "Your data may be stored or processed outside your jurisdiction. By using our Service, you consent to such transfers.",
          "We implement safeguards to protect your data.",
        ],
      },
    ],
  },
  {
    title: "Disclosure of Data",
    subsections: [
      {
        title: "Business Transactions",
        paragraphs: ["Your data may transfer during mergers or acquisitions."],
      },
      {
        title: "Legal Requirements",
        paragraphs: ["We may disclose data to:"],
        bullets: [
          "Comply with law",
          "Protect rights",
          "Prevent wrongdoing",
          "Protect safety",
          "Defend against liability",
        ],
      },
    ],
  },
  {
    title: "Security of Data",
    paragraphs: ["We use commercially reasonable safeguards but cannot guarantee absolute security."],
  },
  {
    title: "Children's Privacy",
    paragraphs: [
      "Our Service does not target anyone under 13. We do not knowingly collect data from children. If discovered, we will delete it promptly.",
    ],
  },
  {
    title: "Links to Other Websites",
    paragraphs: [
      "We are not responsible for third-party privacy practices. Please review external privacy policies.",
    ],
  },
  {
    title: "Changes to This Policy",
    paragraphs: [
      "We may update this Privacy Policy periodically. Changes will be posted and dated on this page.",
    ],
  },
];

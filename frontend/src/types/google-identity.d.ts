// Minimal typings for the Google Identity Services script (https://accounts.google.com/gsi/client).
export {};

declare global {
  interface GoogleCredentialResponse {
    /** Google-signed ID token (JWT). Never log or persist it client-side. */
    credential: string;
    select_by?: string;
  }

  interface GoogleIdConfiguration {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    ux_mode?: "popup" | "redirect";
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    itp_support?: boolean;
    use_fedcm_for_button?: boolean;
  }

  interface GoogleButtonConfiguration {
    type?: "standard" | "icon";
    theme?: "outline" | "filled_blue" | "filled_black";
    size?: "large" | "medium" | "small";
    text?: "signin_with" | "signup_with" | "continue_with" | "signin";
    shape?: "rectangular" | "pill" | "circle" | "square";
    logo_alignment?: "left" | "center";
    width?: number;
    locale?: string;
  }

  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleIdConfiguration) => void;
          renderButton: (parent: HTMLElement, options: GoogleButtonConfiguration) => void;
          cancel: () => void;
        };
      };
    };
  }
}

import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    const baseUrl = "https://tutor-matching-psi.vercel.app/";

    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: ["/admin/", "/learner/", "/request/", "/onboarding", "/offers", "/profile", "/teaching-classes", "/messages/"],
 
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
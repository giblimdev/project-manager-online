// File: /app/api/contact/route.ts

import { NextRequest, NextResponse } from "next/server";

interface ContactData {
  name: string;
  email: string;
  company: string;
  subject: string;
  message: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: ContactData = await request.json();

    // Validation des données
    const { name, email, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "Tous les champs requis doivent être remplis" },
        { status: 400 }
      );
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Format d'email invalide" },
        { status: 400 }
      );
    }

    // Ici vous pouvez intégrer votre service d'email
    // Ex: SendGrid, Mailgun, Resend, etc.
    console.log("Nouveau message de contact:", body);

    // Simulation d'envoi d'email
    // await sendEmail(body);

    return NextResponse.json(
      { message: "Message envoyé avec succès" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur API contact:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}

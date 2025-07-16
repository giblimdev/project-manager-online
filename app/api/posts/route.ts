// app/api/posts/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        id: "desc",
      },
    });
    return NextResponse.json(posts);
  } catch (error) {
    console.error("Erreur lors de la récupération des posts:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des posts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { title, content, authorId } = await request.json();

    if (!title || !authorId) {
      return NextResponse.json(
        { error: "Le titre et l'auteur sont requis" },
        { status: 400 }
      );
    }

    const post = await prisma.post.create({
      data: {
        title,
        content: content || null,
        authorId: parseInt(authorId),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création du post:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du post" },
      { status: 500 }
    );
  }
}

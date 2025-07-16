// app/api/posts/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    const { published } = await request.json();

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const post = await prisma.post.update({
      where: { id },
      data: { published },
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

    return NextResponse.json(post);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du post:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du post" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    await prisma.post.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Post supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du post:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du post" },
      { status: 500 }
    );
  }
}

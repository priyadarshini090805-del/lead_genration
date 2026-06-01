export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();

    const updateData = {
      ...body,
      scheduledAt: body.scheduledAt
        ? new Date(body.scheduledAt)
        : null,
    };

    const content = await prisma.content.update({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      data: updateData,
    });

    return NextResponse.json(content);
  } catch (err: any) {
    if (err.code === "P2025") {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
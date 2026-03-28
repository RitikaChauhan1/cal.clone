import { BookingPageClient } from "@/components/features/BookingPageClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function BookPage({ params }: Props) {
  const { slug } = await params;
  return <BookingPageClient slug={slug} />;
}

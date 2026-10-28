import type { Meta, StoryObj } from "@storybook/react-vite"
import { Card, CardContent } from "@workspace/ui/components/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@workspace/ui/components/carousel"

const meta = {
  title: "Components/Carousel",
  component: Carousel,
  tags: ["autodocs"],
} satisfies Meta<typeof Carousel>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: () => (
    <Carousel className="mx-12 w-full max-w-lg">
      <CarouselContent>
        {[1, 2, 3].map((item) => (
          <CarouselItem key={item} className="md:basis-1/2">
            <Card>
              <CardContent className="flex h-36 items-center justify-center text-3xl font-semibold">
                {item}
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  ),
}

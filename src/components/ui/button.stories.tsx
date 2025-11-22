// import type { Meta, StoryObj } from '@storybook/react';
// import { Button } from '@/components/ui/button';

// const meta: Meta<typeof Button> = {
//   title: 'UI/Button',
//   component: Button,
//   tags: ['autodocs'],
//   args: {
//     children: 'Click Me',
//   },
// };

// export default meta;
// type Story = StoryObj<typeof Button>;

// export const Default: Story = {};

// export const Destructive: Story = {
//   args: {
//     variant: 'destructive',
//   },
// };

// export const Loading: Story = {
//   args: {
//     isLoading: true,
//     loadingText: 'Loading...',
//   },
// };

// export const Outline: Story = {
//   args: {
//     variant: 'outline',
//   },
// };

// export const Ghost: Story = {
//   args: {
//     variant: 'ghost',
//   },
// };

// export const Link: Story = {
//   args: {
//     variant: 'link',
//   },
// };

import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@/components/ui/button';
import { RiAddLine } from '@remixicon/react';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  args: {
    children: 'Click Me',
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
    loadingText: 'Loading...',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
  },
};

export const Link: Story = {
  args: {
    variant: 'link',
  },
};

// Size Variants
export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large',
  },
};

export const Icon: Story = {
  args: {
    size: 'icon',
    children: <RiAddLine className="size-4" />,
    'aria-label': 'Add',
  },
};

// import type { Meta, StoryObj } from '@storybook/react';
// import { Button } from '@/components/ui/button';
// import { RiAddLine } from '@remixicon/react';

// const meta: Meta<typeof Button> = {
//   title: 'UI/Button',
//   component: Button,
//   tags: ['autodocs'],
// };

// export default meta;
// type Story = StoryObj<typeof Button>;

const variants = ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link'] as const;
const sizes = ['sm', 'default', 'lg'] as const;

export const AllVariantsAndSizes: Story = {
  render: () => (
    <div className="space-y-10">
      {variants.map((variant) => (
        <div key={variant}>
          <p className="font-semibold capitalize mb-2">{variant} variant</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {sizes.map((size) => (
              <Button key={`${variant}-${size}`} variant={variant} size={size}>
                {size}
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
};

export const AllLoadingVariantsAndSizes: Story = {
  args: {
    isLoading: true,
    loadingText: 'Loading...',
  },
  render: (args) => (
    <div className="space-y-10">
      {variants.map((variant) => (
        <div key={variant}>
          <p className="font-semibold capitalize mb-2">{variant} variant (Loading)</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {sizes.map((size) => (
              <Button key={`${variant}-${size}`} variant={variant} size={size} {...args}>
                {size}
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
};

import Image from 'next/image';
import { Box } from '@/components/ui/box';
import { RichTextEditor } from '@/components/rich-text-editor/rich-text-editor';
import type { QuoteWithDetails } from '@/features/finances/quotes/types';

interface QuotePreviewItemDetailsProps {
  items: QuoteWithDetails['items'];
}

export function QuotePreviewItemDetails({ items }: QuotePreviewItemDetailsProps) {
  const itemsWithDetails = items.filter(
    (item) => item.attachments.length > 0 || item.notes || (item.colors && item.colors.length > 0),
  );

  if (itemsWithDetails.length === 0) {
    return null;
  }

  return (
    <Box className="mb-8">
      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3">Item Details</p>
      <Box className="space-y-6">
        {itemsWithDetails
          .sort((a, b) => a.order - b.order)
          .map((item) => (
            <Box
              key={item.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800"
            >
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-3">
                {item.description}
                {item.colors && item.colors.length > 0 ? (
                  <span className="text-xs font-normal text-gray-500 dark:text-gray-500 ml-2">
                    ({item.colors.length} {item.colors.length === 1 ? 'color' : 'colors'})
                  </span>
                ) : null}

                {item.attachments.length > 0 ? (
                  <span className="text-xs font-normal text-gray-500 dark:text-gray-500 ml-2">
                    ({item.attachments.length} {item.attachments.length === 1 ? 'image' : 'images'})
                  </span>
                ) : null}
              </h4>

              {item.colors && item.colors.length > 0 ? (
                <Box className="flex flex-wrap gap-2 mb-4">
                  {item.colors.map((color, colorIndex) => (
                    <Box
                      key={`${item.id}-color-${colorIndex}`}
                      className="w-16 h-16 rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-sm"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </Box>
              ) : null}

              {item.attachments.length > 0 ? (
                <Box className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 mb-4">
                  {item.attachments.map((attachment) => (
                    <Box
                      key={attachment.id}
                      className="relative rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900"
                    >
                      <Box className="aspect-square bg-gray-100 dark:bg-gray-800 relative">
                        <Image
                          src={attachment.s3Url}
                          alt={attachment.fileName}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : null}

              {item.notes ? (
                <RichTextEditor
                  key={`editor-readonly-${item.id}`}
                  value={item.notes ?? ''}
                  editable={false}
                />
              ) : null}
            </Box>
          ))}
      </Box>
    </Box>
  );
}

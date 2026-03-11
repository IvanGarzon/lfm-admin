import { RecipeActionProvider } from '@/features/finances/recipes/context/recipe-action-context';

export default function QuotesLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <RecipeActionProvider>
      {children}
      {modal}
    </RecipeActionProvider>
  );
}

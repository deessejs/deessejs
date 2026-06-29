import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';

import { HomeHeader } from "@/components/headers/home-header"
import { HomeFooter } from "@/components/footers/home-footer"

export default function Layout({ children }: LayoutProps<'/docs'>) {
  return (
    <>
      <DocsLayout tree={source.getPageTree()} {...baseOptions()}>
        <HomeHeader />
        
      {children}
    </DocsLayout>
    <HomeFooter />
    </>
  );
}

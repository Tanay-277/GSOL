import React from "react";

type Props = {
  children: React.ReactNode;
};

const layout = ({ children }: Props) => {
  return (
    <section className="container mx-auto max-w-6xl py-8 md:px-4 md:py-12">
      {children}
    </section>
  );
};

export default layout;

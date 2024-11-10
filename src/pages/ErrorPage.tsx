import { PageLayout } from "../components/PageLayout";

export const ErrorPage = () => {
  return (
    <PageLayout>
      <div className="flex-1 flex flex-col justify-center items-center">
        <p className="text-2xl">Error</p>
        <p className="text-xl">Looks like something went wrong :(</p>
      </div>
    </PageLayout>
  );
};

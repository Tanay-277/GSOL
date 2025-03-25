import { db } from "@/db";

export const fetchUserData = async (email: string) => {
  return db.user.findUnique({
    where: { email },
  });
};

export const updateUserData = async ({
  id,
  name,
}: {
  id: string;
  name: string;
}) => {
  return db.user.update({
    where: { id },
    data: {
      name,
    },
  });
};

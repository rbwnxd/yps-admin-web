"use server";

import { axiosApi } from "@/lib/axios";

export const getAnnouncements = async ({
  params,
  jsonWebToken,
}: {
  params?: {
    __skip?: number;
    __limit?: number;
    __includeDeleted?: boolean;
    __includeUnpublished?: boolean;
  };
  jsonWebToken: string | null;
}) => {
  try {
    const { data } = await axiosApi("/admin/announcements", "get", params, {
      headers: {
        Authorization: `jwt ${jsonWebToken}`,
      },
    });
    return (data && data["data"]) || [];
  } catch (error) {
    console.warn("AnnouncementsActions getAnnouncements error", error);
  }
};

export const getAnnouncement = async ({
  id,
  jsonWebToken,
}: {
  id: string;
  jsonWebToken: string | null;
}) => {
  try {
    const { data } = await axiosApi(
      `/admin/announcements/${id}`,
      "get",
      {},
      {
        headers: {
          Authorization: `jwt ${jsonWebToken}`,
        },
      }
    );
    return (data && data["data"] && data["data"]["announcement"]) || null;
  } catch (error) {
    console.warn("AnnouncementsActions getAnnouncement error", error);
  }
};

export const postAnnouncement = async ({
  body,
  jsonWebToken,
}: {
  body: {
    titleList: {
      ko: string;
      en: string;
    }[];
    contentList: {
      ko: string;
      en: string;
    }[];
    publishedAt: string;
    imageList?: { name: string; imageOriginalPath: string }[];
  };
  jsonWebToken: string | null;
}) => {
  try {
    const { data } = await axiosApi("/admin/announcements", "post", body, {
      headers: {
        Authorization: `jwt ${jsonWebToken}`,
      },
    });
    return (data && data["data"] && data["data"]["announcement"]) || null;
  } catch (error) {
    console.warn("AnnouncementsActions postAnnouncement error", error);
  }
};

export const putAnnouncement = async ({
  id,
  body,
  jsonWebToken,
}: {
  id: string;
  body: {
    titleList: {
      ko: string;
      en: string;
    }[];
    contentList: {
      ko: string;
      en: string;
    }[];
    publishedAt: string;
    imageList?: { name: string; imageOriginalPath: string }[];
  };
  jsonWebToken: string | null;
}) => {
  try {
    const { data } = await axiosApi(`/admin/announcements/${id}`, "put", body, {
      headers: {
        Authorization: `jwt ${jsonWebToken}`,
      },
    });
    return (data && data["data"] && data["data"]["announcement"]) || null;
  } catch (error) {
    console.warn("AnnouncementsActions putAnnouncement error", error);
  }
};

export const deleteAnnouncement = async ({
  id,
  jsonWebToken,
}: {
  id: string;
  jsonWebToken: string | null;
}) => {
  try {
    const { data } = await axiosApi(
      `/admin/announcements/${id}`,
      "delete",
      {},
      {
        headers: {
          Authorization: `jwt ${jsonWebToken}`,
        },
      }
    );
    return data && !data?.["error"] ? true : false;
  } catch (error) {
    console.warn("AnnouncementsActions deleteAnnouncement error", error);
  }
};

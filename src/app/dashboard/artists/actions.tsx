"use server";

import { axiosApi } from "@/lib/axios";

export const getArtists = async ({
  params,
  jsonWebToken,
}: {
  params?: {
    __skip?: number;
    __limit?: number;
    __includeDeleted?: boolean;
  };
  jsonWebToken: string | null;
}) => {
  try {
    const { data } = await axiosApi("/admin/artists", "get", params, {
      headers: {
        Authorization: `jwt ${jsonWebToken}`,
      },
    });
    return (data && data["data"]) || [];
  } catch (error) {
    console.warn("AnnouncementsActions getAnnouncements error", error);
  }
};

export const getArtist = async ({
  id,
  jsonWebToken,
}: {
  id: string;
  jsonWebToken: string | null;
}) => {
  try {
    const { data } = await axiosApi(
      `/admin/artists/${id}`,
      "get",
      {},
      {
        headers: {
          Authorization: `jwt ${jsonWebToken}`,
        },
      }
    );
    return (data && data["data"] && data["data"]["artist"]) || null;
  } catch (error) {
    console.warn("AnnouncementsActions getAnnouncement error", error);
  }
};

export const postArtist = async ({
  body,
  jsonWebToken,
}: {
  body: {
    nameList: {
      ko: string;
      en: string;
    }[];
    imageList?: { name: string; imageOriginalPath: string }[];
  };
  jsonWebToken: string | null;
}) => {
  try {
    const { data } = await axiosApi("/admin/artists", "post", body, {
      headers: {
        Authorization: `jwt ${jsonWebToken}`,
      },
    });
    return (data && data["data"] && data["data"]["artist"]) || null;
  } catch (error) {
    console.warn("AnnouncementsActions postArtist error", error);
  }
};

export const patchArtist = async ({
  id,
  body,
  jsonWebToken,
}: {
  id: string;
  body: {
    nameList: {
      ko: string;
      en: string;
    }[];
    imageList?: { name: string; imageOriginalPath: string }[];
  };
  jsonWebToken: string | null;
}) => {
  try {
    const { data } = await axiosApi(`/admin/artists/${id}`, "patch", body, {
      headers: {
        Authorization: `jwt ${jsonWebToken}`,
      },
    });
    return (data && data["data"] && data["data"]["artist"]) || null;
  } catch (error) {
    console.warn("AnnouncementsActions patchArtist error", error);
  }
};

export const deleteArtist = async ({
  id,
  jsonWebToken,
}: {
  id: string;
  jsonWebToken: string | null;
}) => {
  try {
    const { data } = await axiosApi(
      `/admin/artists/${id}`,
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
    console.warn("AnnouncementsActions deleteArtist error", error);
  }
};

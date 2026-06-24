"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Users,
  Loader2,
  Mail,
  Phone,
  Calendar,
  Coins,
  Shield,
  Ban,
  UserCheck,
  User2,
  UserX,
  AlertTriangle,
  Mic2,
} from "lucide-react";
import {
  getUserDetail,
  banUser,
  restrictUser,
  liftBanUser,
  liftRestrictUser,
  promoteUser,
} from "../actions";
import { toast } from "sonner";
import moment from "moment";
import { STORAGE_URL } from "@/lib/api";
import { User } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const jsonWebToken = useAuthStore((state) => state.token);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // 다이얼로그 상태
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [unbanDialogOpen, setUnbanDialogOpen] = useState(false);
  const [restrictDialogOpen, setRestrictDialogOpen] = useState(false);
  const [unrestrictDialogOpen, setUnrestrictDialogOpen] = useState(false);
  const [promoteToArtistDialogOpen, setPromoteToArtistDialogOpen] =
    useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // 폼 상태
  const [banReason, setBanReason] = useState("");
  const [unbanReason, setUnbanReason] = useState("");
  const [restrictReason, setRestrictReason] = useState("");
  const [unrestrictReason, setUnrestrictReason] = useState("");
  const [restrictDuration, setRestrictDuration] = useState(7);

  useEffect(() => {
    if (!jsonWebToken || !params.id) return;

    const fetchUserDetail = async () => {
      setLoading(true);
      try {
        const result = await getUserDetail({
          userId: params.id,
          jsonWebToken,
        });

        if (result?.user) {
          setUser(result.user);
        } else {
          toast.error("사용자 정보를 찾을 수 없습니다.");
          router.replace("/dashboard/users");
        }
      } catch (error) {
        console.error("사용자 상세 조회 오류:", error);
        toast.error("사용자 정보 조회에 실패했습니다.");
        router.replace("/dashboard/users");
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetail();
  }, [jsonWebToken, params.id, router]);

  // 차단 처리
  const handleBanUser = async () => {
    if (!banReason.trim()) {
      toast.error("차단 사유를 입력해주세요.");
      return;
    }

    setActionLoading(true);
    try {
      await banUser({
        userId: params.id,
        reason: banReason.trim(),
        jsonWebToken: jsonWebToken!,
      });

      toast.success("사용자가 성공적으로 차단되었습니다.");
      setBanDialogOpen(false);
      setBanReason("");

      // 사용자 정보 다시 불러오기
      const result = await getUserDetail({
        userId: params.id,
        jsonWebToken: jsonWebToken!,
      });
      if (result?.user) {
        setUser(result.user);
      }
    } catch (error) {
      console.error("사용자 차단 오류:", error);
      toast.error("사용자 차단에 실패했습니다.");
    } finally {
      setActionLoading(false);
    }
  };

  // 활동정지 처리
  const handleRestrictUser = async () => {
    if (!restrictReason.trim()) {
      toast.error("활동정지 사유를 입력해주세요.");
      return;
    }

    if (restrictDuration < 1) {
      toast.error("활동정지 기간은 최소 1일 이상이어야 합니다.");
      return;
    }

    setActionLoading(true);
    try {
      await restrictUser({
        userId: params.id,
        reason: restrictReason.trim(),
        restrictDurationInDays: restrictDuration,
        jsonWebToken: jsonWebToken!,
      });

      toast.success(`사용자가 ${restrictDuration}일간 활동정지되었습니다.`);
      setRestrictDialogOpen(false);
      setRestrictReason("");
      setRestrictDuration(7);

      // 사용자 정보 다시 불러오기
      const result = await getUserDetail({
        userId: params.id,
        jsonWebToken: jsonWebToken!,
      });
      if (result?.user) {
        setUser(result.user);
      }
    } catch (error) {
      console.error("사용자 활동정지 오류:", error);
      toast.error("사용자 활동정지에 실패했습니다.");
    } finally {
      setActionLoading(false);
    }
  };

  // 활동정지 해제 처리
  const handleUnrestrictUser = async () => {
    if (!unrestrictReason.trim()) {
      toast.error("활동정지 해제 사유를 입력해주세요.");
      return;
    }

    setActionLoading(true);
    try {
      await liftRestrictUser({
        userId: params.id,
        reason: unrestrictReason.trim(),
        jsonWebToken: jsonWebToken!,
      });

      toast.success("사용자 활동정지가 해제되었습니다.");
      setUnrestrictDialogOpen(false);
      setUnrestrictReason("");

      // 사용자 정보 다시 불러오기
      const result = await getUserDetail({
        userId: params.id,
        jsonWebToken: jsonWebToken!,
      });
      if (result?.user) {
        setUser(result.user);
      }
    } catch (error) {
      console.error("활동정지 해제 오류:", error);
      toast.error("활동정지 해제에 실패했습니다.");
    } finally {
      setActionLoading(false);
    }
  };

  // 차단 해제 처리
  const handleUnbanUser = async () => {
    if (!unbanReason.trim()) {
      toast.error("차단 해제 사유를 입력해주세요.");
      return;
    }

    setActionLoading(true);
    try {
      await liftBanUser({
        userId: params.id,
        reason: unbanReason.trim(),
        jsonWebToken: jsonWebToken!,
      });

      toast.success("사용자 차단이 해제되었습니다.");
      setUnbanDialogOpen(false);
      setUnbanReason("");

      // 사용자 정보 다시 불러오기
      const result = await getUserDetail({
        userId: params.id,
        jsonWebToken: jsonWebToken!,
      });
      if (result?.user) {
        setUser(result.user);
      }
    } catch (error) {
      console.error("차단 해제 오류:", error);
      toast.error("차단 해제에 실패했습니다.");
    } finally {
      setActionLoading(false);
    }
  };

  // 아티스트 승격 처리
  const handlePromoteToArtistUser = async () => {
    setActionLoading(true);
    try {
      await promoteUser({
        userId: params.id,
        jsonWebToken: jsonWebToken!,
      });

      toast.success("사용자가 아티스트로 승격되었습니다.");
      setPromoteToArtistDialogOpen(false);

      // 사용자 정보 다시 불러오기
      const result = await getUserDetail({
        userId: params.id,
        jsonWebToken: jsonWebToken!,
      });
      if (result?.user) {
        setUser(result.user);
      }
    } catch (error) {
      console.error("아티스트 승격 오류:", error);
      toast.error("아티스트 승격에 실패했습니다.");
    } finally {
      setActionLoading(false);
    }
  };

  const getPlatformLabel = (platform: string) => {
    const platformMap: { [key: string]: string } = {
      GOOGLE: "구글",
      APPLE: "애플",
      KAKAO: "카카오",
      NAVER: "네이버",
    };
    return platformMap[platform] || platform;
  };

  const getGenderLabel = (gender: string) => {
    const genderMap: { [key: string]: string } = {
      MALE: "남성",
      FEMALE: "여성",
      OTHER: "기타",
    };
    return genderMap[gender] || gender;
  };

  if (!jsonWebToken) {
    return (
      <div className="container mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Users className="h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground">
              로그인이 필요합니다
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Users className="h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground">
              사용자를 찾을 수 없습니다
            </p>
            <Button onClick={() => router.back()}>돌아가기</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl">
      {/* 상단 네비게이션 */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          돌아가기
        </Button>

        {/* 관리 액션 버튼들 */}
        <div className="flex items-center gap-2">
          {user?.gradeInfo?.title?.toUpperCase() !== "ARTIST" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPromoteToArtistDialogOpen(true)}
              className="flex items-center gap-2 text-green-500 hover:text-green-600 hover:bg-green-50"
              disabled={loading || actionLoading}
            >
              <Mic2 className="w-4 h-4" />
              아티스트 승격
            </Button>
          )}
          {user?.restrictionInfo?.isRestricted ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUnrestrictDialogOpen(true)}
              className="flex items-center gap-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
              disabled={loading || actionLoading}
            >
              <AlertTriangle className="w-4 h-4" />
              정지 해제
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRestrictDialogOpen(true)}
              className="flex items-center gap-2 text-orange-500 hover:text-orange-600 hover:bg-orange-50"
              disabled={loading || actionLoading}
            >
              <AlertTriangle className="w-4 h-4" />
              활동정지
            </Button>
          )}
          {user?.banInfo?.isBanned ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUnbanDialogOpen(true)}
              className="flex items-center gap-2 text-green-600 hover:text-green-700 hover:bg-green-50"
              disabled={loading || actionLoading}
            >
              <UserCheck className="w-4 h-4" />
              차단 해제
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBanDialogOpen(true)}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              disabled={loading || actionLoading}
            >
              <UserX className="w-4 h-4" />
              계정차단
            </Button>
          )}
        </div>
      </div>

      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-8 h-8" />
        <div>
          <h1 className="text-3xl font-bold">사용자 상세 정보</h1>
          <p className="text-muted-foreground">
            {user.profile.nickname}님의 상세 정보
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* 기본 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              기본 정보
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col w-full items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  src={
                    user.imageList?.[0]?.image512Path
                      ? `${STORAGE_URL}/${user.imageList[0].image512Path}`
                      : undefined
                  }
                  alt={user.profile.nickname}
                />
                <AvatarFallback className="text-2xl">
                  <User2 className="w-12 h-12" />
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-4 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      id
                    </Label>
                    <p className="font-medium mt-1 font-mono text-sm break-all">
                      {user._id}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      닉네임
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="font-medium">{user.profile.nickname}</p>
                      {user.restrictionInfo.isRestricted && (
                        <Badge variant="destructive" className="text-xs">
                          제한됨
                        </Badge>
                      )}
                      {user.banInfo.isBanned && (
                        <Badge variant="destructive" className="text-xs">
                          차단됨
                        </Badge>
                      )}
                      {user.deletedAt && (
                        <Badge variant="secondary" className="text-xs">
                          탈퇴
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      이름
                    </Label>
                    <p className="font-medium mt-1">{user.profile.name}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      이메일
                      {user.emailVerifiedAt && (
                        <Badge variant="outline" className="text-xs">
                          인증됨
                        </Badge>
                      )}
                    </Label>
                    <div className="flex items-center gap-2 mt-1 flex-shrink">
                      <p className="font-medium break-all">{user.email}</p>
                    </div>
                  </div>

                  {/* <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      전화번호
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="font-medium">{user.profile.phoneNumber}</p>
                    </div>
                  </div> */}

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      성별
                    </Label>
                    <p className="font-medium mt-1">
                      {getGenderLabel(user.profile.gender)}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      생년월일
                    </Label>
                    <p className="font-medium mt-1">
                      {moment(user.profile.birth).format("YYYY-MM-DD")}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      가입 플랫폼
                    </Label>
                    <p className="font-medium mt-1">
                      {getPlatformLabel(user.platform)}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      등급
                    </Label>
                    <p className="font-medium mt-1">{user?.gradeInfo?.title}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      회원 해시
                    </Label>
                    <p className="font-medium mt-1 font-mono text-sm break-all">
                      {user.memberHash}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 포인트 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5" />
              포인트 정보
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg space-y-2">
                <p className="text-2xl font-bold ">
                  {user.point.currentPoint.toLocaleString()}P
                </p>
                <p className="text-sm text-muted-foreground">현재 포인트</p>
              </div>

              <div className="text-center p-4 border rounded-lg space-y-2">
                <p className="text-2xl font-bold ">
                  {user.point.totalReceivedPoint.toLocaleString()}P
                </p>
                <p className="text-sm text-muted-foreground">총 획득 포인트</p>
              </div>

              <div className="text-center p-4 border rounded-lg space-y-2">
                <p className="text-2xl font-bold ">
                  {user.point.totalUsedPoint.toLocaleString()}P
                </p>
                <p className="text-sm text-muted-foreground">총 사용 포인트</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 제재 정보 */}
        {(user.restrictionInfo.isRestricted || user.banInfo.isBanned) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                제재 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {user.restrictionInfo.isRestricted && (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4" />
                    <h4 className="font-medium">이용 제한</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>제한 사유:</strong>{" "}
                      {user.restrictionInfo.restrictedReason || "사유 없음"}
                    </p>
                    {user.restrictionInfo.restrictedAt && (
                      <p>
                        <strong>제한 시작:</strong>{" "}
                        {moment(user.restrictionInfo.restrictedAt).format(
                          "YYYY-MM-DD HH:mm"
                        )}
                      </p>
                    )}
                    {user.restrictionInfo.restrictionEndsAt && (
                      <p>
                        <strong>제한 종료:</strong>{" "}
                        {moment(user.restrictionInfo.restrictionEndsAt).format(
                          "YYYY-MM-DD HH:mm"
                        )}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {user.banInfo.isBanned && (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Ban className="w-4 h-4" />
                    <h4 className="font-medium">계정 차단</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>차단 사유:</strong>{" "}
                      {user.banInfo.bannedReason || "사유 없음"}
                    </p>
                    {user.banInfo.bannedAt && (
                      <p>
                        <strong>차단 일시:</strong>{" "}
                        {moment(user.banInfo.bannedAt).format(
                          "YYYY-MM-DD HH:mm"
                        )}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 활동 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              활동 정보
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  가입일
                </Label>
                <p className="font-medium mt-1">
                  {moment(user.createdAt).format("YYYY년 MM월 DD일 HH:mm")}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  최근 수정일
                </Label>
                <p className="font-medium mt-1">
                  {moment(user.updatedAt).format("YYYY년 MM월 DD일 HH:mm")}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  약관 동의일
                </Label>
                <p className="font-medium mt-1">
                  {user?.termsAgreedAt &&
                    moment(user.termsAgreedAt).format("YYYY년 MM월 DD일 HH:mm")}
                </p>
              </div>

              {user.nicknameChangedAt && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    닉네임 변경일
                  </Label>
                  <p className="font-medium mt-1">
                    {moment(user.nicknameChangedAt).format(
                      "YYYY년 MM월 DD일 HH:mm"
                    )}
                  </p>
                </div>
              )}

              {user.emailVerifiedAt && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    이메일 인증일
                  </Label>
                  <p className="font-medium mt-1">
                    {moment(user.emailVerifiedAt).format(
                      "YYYY년 MM월 DD일 HH:mm"
                    )}
                  </p>
                </div>
              )}

              {user.deletedAt && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    탈퇴일
                  </Label>
                  <p className="font-medium text-red-600 mt-1">
                    {moment(user.deletedAt).format("YYYY년 MM월 DD일 HH:mm")}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 차단 다이얼로그 */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserX className="w-5 h-5" />
              사용자 계정 차단
            </DialogTitle>
            <DialogDescription className="whitespace-pre-line">
              {`${user?.profile?.nickname}님의 계정을 영구적으로 차단합니다.\n차단된 계정은 모든 서비스 이용이 제한됩니다.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">차단 사유</Label>
              <Textarea
                placeholder="차단 사유를 입력해주세요..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBanDialogOpen(false);
                setBanReason("");
              }}
              disabled={actionLoading}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleBanUser}
              disabled={actionLoading || !banReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  처리중...
                </>
              ) : (
                "계정 차단"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 활동정지 다이얼로그 */}
      <Dialog open={restrictDialogOpen} onOpenChange={setRestrictDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 " />
              사용자 활동정지
            </DialogTitle>
            <DialogDescription className="whitespace-pre-line">
              {`${user?.profile.nickname}님의 계정을 일정 기간 동안 활동정지합니다.\n활동정지 기간 동안 일부 서비스 이용이 제한됩니다.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">활동정지 사유</Label>
              <Textarea
                placeholder="활동정지 사유를 입력해주세요..."
                value={restrictReason}
                onChange={(e) => setRestrictReason(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label className="text-sm font-medium">활동정지 기간 (일)</Label>
              <Input
                type="number"
                min="1"
                value={restrictDuration || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setRestrictDuration(val === "" ? 0 : Number(val) || 0);
                }}
                onBlur={(e) => {
                  const numVal = Number(e.target.value);
                  if (isNaN(numVal) || numVal < 1) {
                    setRestrictDuration(7);
                  }
                }}
                className="mt-1"
                placeholder="7"
              />
              <p className="text-xs text-muted-foreground mt-1">
                1일 이상으로 설정 가능합니다
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRestrictDialogOpen(false);
                setRestrictReason("");
                setRestrictDuration(7);
              }}
              disabled={actionLoading}
            >
              취소
            </Button>
            <Button
              onClick={handleRestrictUser}
              disabled={
                actionLoading || !restrictReason.trim() || restrictDuration < 1
              }
              variant="destructive"
              className="cursor-pointer"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  처리중...
                </>
              ) : (
                `${restrictDuration}일 활동정지`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 차단 해제 다이얼로그 */}
      <Dialog open={unbanDialogOpen} onOpenChange={setUnbanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              사용자 계정 차단 해제
            </DialogTitle>
            <DialogDescription className="whitespace-pre-line">
              {`${user?.profile?.nickname}님의 계정 차단을 해제합니다.\n차단이 해제되면 정상적인 서비스 이용이 가능합니다.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">차단 해제 사유</Label>
              <Textarea
                placeholder="차단 해제 사유를 입력해주세요..."
                value={unbanReason}
                onChange={(e) => setUnbanReason(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUnbanDialogOpen(false);
                setUnbanReason("");
              }}
              disabled={actionLoading}
            >
              취소
            </Button>
            <Button
              variant="default"
              onClick={handleUnbanUser}
              disabled={actionLoading || !unbanReason.trim()}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  처리중...
                </>
              ) : (
                "차단 해제"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 활동정지 해제 다이얼로그 */}
      <Dialog
        open={unrestrictDialogOpen}
        onOpenChange={setUnrestrictDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              사용자 활동정지 해제
            </DialogTitle>
            <DialogDescription className="whitespace-pre-line">
              {`${user?.profile?.nickname}님의 활동정지를 해제합니다.\n활동정지가 해제되면 정상적인 서비스 이용이 가능합니다.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">활동정지 해제 사유</Label>
              <Textarea
                placeholder="활동정지 해제 사유를 입력해주세요..."
                value={unrestrictReason}
                onChange={(e) => setUnrestrictReason(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUnrestrictDialogOpen(false);
                setUnrestrictReason("");
              }}
              disabled={actionLoading}
            >
              취소
            </Button>
            <Button
              variant="default"
              onClick={handleUnrestrictUser}
              disabled={actionLoading || !unrestrictReason.trim()}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  처리중...
                </>
              ) : (
                "활동정지 해제"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 아티스트 승격 다이얼로그 */}
      <Dialog
        open={promoteToArtistDialogOpen}
        onOpenChange={setPromoteToArtistDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic2 className="w-5 h-5" />
              사용자 아티스트 승격
            </DialogTitle>
            <DialogDescription className="whitespace-pre-line">
              {`${user?.profile?.nickname}님을 아티스트로 승격합니다.`}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPromoteToArtistDialogOpen(false);
              }}
              disabled={actionLoading}
            >
              취소
            </Button>
            <Button
              variant="default"
              onClick={handlePromoteToArtistUser}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  처리중...
                </>
              ) : (
                "아티스트 승격"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

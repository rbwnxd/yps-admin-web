"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useChartStore } from "@/store/chartStore";
import { ChartItem, SeasonChartForm } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, X, Calendar, Settings } from "lucide-react";
import { createSeasonChart, createSystemCharts } from "../actions";
import { toast } from "sonner";

export default function ChartCreatePage() {
  const router = useRouter();
  const jsonWebToken = useAuthStore((state) => state.token);
  const { addChart } = useChartStore();

  const [seasonForm, setSeasonForm] = useState<SeasonChartForm>({
    nameKo: "",
    nameEn: "",
    descriptionKo: "",
    descriptionEn: "",
    startedAt: "",
    endedAt: "",
  });

  const [isSeasonLoading, setIsSeasonLoading] = useState(false);
  const [isSystemLoading, setIsSystemLoading] = useState(false);

  const handleSeasonInputChange = (
    field: keyof SeasonChartForm,
    value: string
  ) => {
    setSeasonForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSeasonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jsonWebToken) {
      toast.error("인증 토큰이 없습니다.");
      return;
    }

    // 유효성 검사
    if (!seasonForm.nameKo.trim()) {
      toast.error("한국어 차트명을 입력해주세요.");
      return;
    }

    if (!seasonForm.startedAt || !seasonForm.endedAt) {
      toast.error("시즌 시작일과 종료일을 모두 입력해주세요.");
      return;
    }

    if (new Date(seasonForm.startedAt) >= new Date(seasonForm.endedAt)) {
      toast.error("시즌 종료일이 시작일보다 늦어야 합니다.");
      return;
    }

    setIsSeasonLoading(true);
    try {
      const result = await createSeasonChart({
        body: {
          nameList: [
            {
              ko: seasonForm.nameKo.trim(),
              en: seasonForm.nameEn.trim() || seasonForm.nameKo.trim(),
            },
          ],
          descriptionList: [
            {
              ko: seasonForm.descriptionKo.trim() || seasonForm.nameKo.trim(),
              en:
                seasonForm.descriptionEn.trim() ||
                seasonForm.nameEn.trim() ||
                seasonForm.nameKo.trim(),
            },
          ],
          season: {
            startedAt: new Date(seasonForm.startedAt).toISOString(),
            endedAt: new Date(seasonForm.endedAt).toISOString(),
          },
        },
        jsonWebToken,
      });

      if (result) {
        // 새로 생성된 차트를 store에 추가
        addChart(result);
        toast.success("시즌 차트가 성공적으로 생성되었습니다.");
        router.replace("/dashboard/charts");
      }
    } catch (error) {
      console.error("Season chart creation error:", error);
      toast.error("시즌 차트 생성 중 오류가 발생했습니다.");
    } finally {
      setIsSeasonLoading(false);
    }
  };

  const handleSystemChartCreate = async () => {
    if (!jsonWebToken) {
      toast.error("인증 토큰이 없습니다.");
      return;
    }

    setIsSystemLoading(true);
    try {
      const result = await createSystemCharts({
        jsonWebToken,
      });

      if (result) {
        // 새로 생성된 차트들을 store에 추가
        if (Array.isArray(result.charts)) {
          result.charts.forEach((chart: ChartItem) => addChart(chart));
        }
        toast.success("시스템 차트가 성공적으로 등록되었습니다.");
        router.replace("/dashboard/charts");
      }
    } catch (error) {
      console.error("System charts creation error:", error);
      toast.error("시스템 차트 등록 중 오류가 발생했습니다.");
    } finally {
      setIsSystemLoading(false);
    }
  };

  return (
    <div className="container mx-auto">
      {/* 상단 네비게이션 */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          disabled={isSeasonLoading || isSystemLoading}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          돌아가기
        </Button>

        <Button
          variant="outline"
          onClick={() => router.replace("/dashboard/charts")}
          disabled={isSeasonLoading || isSystemLoading}
          className="flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          취소
        </Button>
      </div>

      {/* 메인 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">차트 생성</CardTitle>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="season" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="season" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                시즌 차트 생성
              </TabsTrigger>
              <TabsTrigger value="system" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                시스템 차트 등록
              </TabsTrigger>
            </TabsList>

            <TabsContent value="season" className="space-y-6 mt-6">
              <form onSubmit={handleSeasonSubmit} className="space-y-6">
                {/* 차트명 섹션 */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">차트명</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="nameKo" className="text-sm font-medium">
                        한국어 차트명 *
                      </Label>
                      <Input
                        id="nameKo"
                        value={seasonForm.nameKo}
                        onChange={(e) =>
                          handleSeasonInputChange("nameKo", e.target.value)
                        }
                        placeholder="예: 2024 겨울 시즌 차트"
                        required
                        disabled={isSeasonLoading}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="nameEn" className="text-sm font-medium">
                        영어 차트명
                      </Label>
                      <Input
                        id="nameEn"
                        value={seasonForm.nameEn}
                        onChange={(e) =>
                          handleSeasonInputChange("nameEn", e.target.value)
                        }
                        placeholder="예: 2024 Winter Season Chart"
                        disabled={isSeasonLoading}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* 설명 섹션 */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">차트 설명</h3>
                  <div className="space-y-4">
                    <div>
                      <Label
                        htmlFor="descriptionKo"
                        className="text-sm font-medium"
                      >
                        한국어 설명
                      </Label>
                      <Textarea
                        id="descriptionKo"
                        value={seasonForm.descriptionKo}
                        onChange={(e) =>
                          handleSeasonInputChange(
                            "descriptionKo",
                            e.target.value
                          )
                        }
                        placeholder="차트에 대한 설명을 입력하세요"
                        disabled={isSeasonLoading}
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="descriptionEn"
                        className="text-sm font-medium"
                      >
                        영어 설명
                      </Label>
                      <Textarea
                        id="descriptionEn"
                        value={seasonForm.descriptionEn}
                        onChange={(e) =>
                          handleSeasonInputChange(
                            "descriptionEn",
                            e.target.value
                          )
                        }
                        placeholder="Enter chart description"
                        disabled={isSeasonLoading}
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* 시즌 기간 섹션 */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">시즌 기간</h3>
                  <div className="flex flex-col md:flex-row gap-4">
                    <div>
                      <Label
                        htmlFor="startedAt"
                        className="text-sm font-medium"
                      >
                        시작일 *
                      </Label>
                      <Input
                        id="startedAt"
                        type="datetime-local"
                        value={seasonForm.startedAt}
                        onChange={(e) =>
                          handleSeasonInputChange("startedAt", e.target.value)
                        }
                        required
                        disabled={isSeasonLoading}
                        className="mt-1 w-fit"
                      />
                    </div>
                    <div>
                      <Label htmlFor="endedAt" className="text-sm font-medium">
                        종료일 *
                      </Label>
                      <Input
                        id="endedAt"
                        type="datetime-local"
                        value={seasonForm.endedAt}
                        onChange={(e) =>
                          handleSeasonInputChange("endedAt", e.target.value)
                        }
                        required
                        disabled={isSeasonLoading}
                        className="mt-1 w-fit"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSeasonLoading}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {isSeasonLoading ? "생성 중..." : "시즌 차트 생성"}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="system" className="space-y-6 mt-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Settings className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    시스템 차트 등록
                  </h3>
                  <p className="text-muted-foreground">
                    기본 시스템 차트(데일리 누적, 올타임 누적)를 등록합니다.
                  </p>
                </div>
                <Button
                  onClick={handleSystemChartCreate}
                  disabled={isSystemLoading}
                  className="flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  {isSystemLoading ? "등록 중..." : "시스템 차트 등록"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

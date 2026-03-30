"use client";

import { useEffect, useMemo, useState } from "react";

import { backgroundJobCatalog } from "@/lib/background-jobs/catalog";

export default function DocumentIntelligenceWorkspace() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const previewUrl = useMemo(
    () => (selectedFile ? URL.createObjectURL(selectedFile) : null),
    [selectedFile]
  );

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const documentPipeline = backgroundJobCatalog.filter((job) => job.queue === "clinical-documents");

  const extractedFields = selectedFile
    ? [
        { label: "Tipo detectado", value: selectedFile.type.includes("pdf") ? "Resultado PDF" : "Imagen clinica" },
        { label: "Tamano", value: `${Math.max(1, Math.round(selectedFile.size / 1024))} KB` },
        { label: "Estado OCR", value: "Pendiente de conexion con motor documental" },
        { label: "Indexacion", value: "Lista para clasificacion y metadatos" },
      ]
    : [];

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_380px]">
      <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Ingreso documental
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-950">
              Carga y vista previa de documentos clinicos
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
              La interfaz queda lista para conectarse despues a OCR real, clasificacion documental,
              indexacion y archivado clinico.
            </p>
          </div>

          <label className="cursor-pointer rounded-[18px] border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100">
            Subir archivo
            <input
              type="file"
              accept=".pdf,image/*"
              className="hidden"
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Metadatos del archivo</p>
            {selectedFile ? (
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <p className="font-medium text-slate-900">{selectedFile.name}</p>
                {extractedFields.map((field) => (
                  <div key={field.label} className="rounded-[18px] border border-slate-200 bg-white px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {field.label}
                    </p>
                    <p className="mt-1 text-sm text-slate-700">{field.value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                Acepta PDF o imagen. El sistema puede quedar enlazado despues a OCR y extraccion estructurada.
              </p>
            )}
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-950/95 p-4">
            <p className="text-sm font-semibold text-white">Vista previa</p>
            <div className="mt-3 overflow-hidden rounded-[20px] bg-white">
              {selectedFile && previewUrl ? (
                selectedFile.type.includes("image") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt={selectedFile.name} className="h-[320px] w-full object-contain" />
                ) : (
                  <iframe src={previewUrl} title={selectedFile.name} className="h-[320px] w-full" />
                )
              ) : (
                <div className="flex h-[320px] items-center justify-center px-6 text-center text-sm text-slate-500">
                  Selecciona un documento para mostrar la vista previa y preparar el flujo documental.
                </div>
              )}
            </div>
          </div>
        </div>
      </article>

      <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          Pipeline asincrono
        </p>
        <h3 className="mt-2 text-lg font-semibold text-slate-950">Procesamiento en segundo plano</h3>
        <div className="mt-4 space-y-3">
          {documentPipeline.map((job) => (
            <div key={job.id} className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">{job.name}</p>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  {job.status}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{job.description}</p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                Cola {job.queue} · disparo {job.trigger}
              </p>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}

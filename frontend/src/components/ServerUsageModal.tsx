import { useEffect, useState } from "react";
import Modal from "./Modal";
import ModalDescription from "./Modal/components/ModalDescription";
import ModalHeader from "./Modal/components/ModalHeader";
import ModalTitle from "./Modal/components/ModalTitle";
import SpinnerIcon from "../icons/SpinnerIcon";

interface ServerUsage {
  cpu: {
    cores: number[];
    total: number;
  };
  memory: {
    free: number;
    percent: number;
    total: number;
    used: number;
  };
  partitions: {
    device: string;
    total: number;
    free: number;
    used: number;
    percent: number;
  }[];
  swap: {
    total: number;
    used: number;
    percent: number;
  };
}

function PartitionBar({
  device,
  used,
  total,
  percent,
}: {
  device: string;
  used: number;
  total: number;
  percent: number;
}) {
  const diskUsed = Math.fround(used / 1024 ** 3).toFixed(1);
  const diskTotal = Math.fround(total / 1024 ** 3).toFixed(1);

  return (
    <div className="flex flex-col">
      <div className="flex flex-row gap-2">
        <span className="font-bold">{device}</span>
        <span>{percent}%</span>
      </div>
      <div className="flex flex-row gap-2">
        <span>{diskUsed}</span>
        <span>/</span>
        <span>{diskTotal}GB</span>
      </div>
      <div className="w-full bg-surface-base border border-stroke h-4 rounded-full">
        <div
          className="bg-brand-pink h-full rounded-full z-10"
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    </div>
  );
}

export default function ServerUsageModal() {
  const [serverUsage, setServerUsage] = useState<ServerUsage | null>(null);
  const [fetchStatus, setFetchStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  useEffect(() => {
    const fetchServerUsage = async () => {
      if (fetchStatus !== "idle") return;

      setFetchStatus("loading");

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/usage`);

      if (response.ok) {
        const responseBody = (await response.json()) as ServerUsage;

        // Sort partition used amount in descending order
        responseBody.partitions.sort((partA, partB) => partB.used - partA.used);

        setServerUsage(responseBody);
        setFetchStatus("success");
      } else {
        console.log(response.text);
        setFetchStatus("error");
      }
    };

    fetchServerUsage();
  }, [fetchStatus]);

  return (
    <Modal>
      <ModalHeader>
        <ModalTitle>Server Usage</ModalTitle>
        <ModalDescription>This shows the server usage</ModalDescription>
      </ModalHeader>
      {fetchStatus === "success" && serverUsage !== null ? (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col">
            <span>CPU Usage: {serverUsage.cpu.total}%</span>
            <span>RAM Usage: {serverUsage.memory.percent}%</span>
            <div className="flex flex-row gap-2">
              <span>RAM Usage (Detailed):</span>
              <span>
                {Math.fround(serverUsage.memory.used / 1024 ** 3).toFixed(1)}GB
              </span>
              <span>/</span>
              <span>
                {Math.fround(serverUsage.memory.total / 1024 ** 3).toFixed(1)}GB
              </span>
            </div>
          </div>
          <div className="flex flex-col min-h-48 max-h-64 gap-2 bg-surface border border-stroke p-2 rounded-lg overflow-y-scroll no-scrollbar">
            {serverUsage.partitions.map((partition, index) => (
              <PartitionBar
                key={`partition_${index}`}
                device={partition.device}
                used={partition.used}
                total={partition.total}
                percent={partition.percent}
              />
            ))}
          </div>
        </div>
      ) : fetchStatus === "error" ? (
        <div className="flex flex-col items-center py-8">
          <span className="font-bold text-lg text-center w-[75%]">
            An error occured while loading the server usage
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-center py-8">
          <SpinnerIcon className="text-white animate-spin h-10 w-10" />
          <span className="font-bold text-lg">Loading</span>
        </div>
      )}
    </Modal>
  );
}

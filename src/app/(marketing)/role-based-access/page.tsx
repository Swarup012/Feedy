"use client";

import { useRouter } from "next/navigation";
import {
  IconShieldCheck,
  IconUsers,
  IconLock,
  IconUserCheck,
  IconSettings,
  IconEye,
  IconBrandTabler,
} from "@tabler/icons-react";
import { LandingFooter } from "@/components/ui/landing-footer";

export default function RoleBasedAccessPage() {
  const router = useRouter();

  const features = [
    {
      icon: <IconShieldCheck className="w-6 h-6 text-blue-600" />,
      title: "Admin Controls",
      description:
        "Full control over feedback boards, roadmaps, and changelog. Manage all aspects of your product feedback.",
    },
    {
      icon: <IconUsers className="w-6 h-6 text-purple-600" />,
      title: "Team Member Access",
      description:
        "Allow team members to view, comment, and manage feedback without full admin privileges.",
    },
    {
      icon: <IconEye className="w-6 h-6 text-green-600" />,
      title: "Viewer Permissions",
      description:
        "Grant read-only access to stakeholders who need visibility without editing capabilities.",
    },
    {
      icon: <IconUserCheck className="w-6 h-6 text-orange-600" />,
      title: "Custom Roles",
      description:
        "Define specific permissions for different team roles including support, product, and engineering.",
    },
    {
      icon: <IconLock className="w-6 h-6 text-red-600" />,
      title: "Private Boards",
      description:
        "Control who can see and interact with specific feedback boards based on their role.",
    },
    {
      icon: <IconSettings className="w-6 h-6 text-indigo-600" />,
      title: "Granular Permissions",
      description:
        "Fine-tune access controls for features like posting, voting, commenting, and roadmap management.",
    },
  ];

  const useCases = [
    {
      title: "Product Teams",
      description:
        "Give product managers full control while allowing designers and engineers to contribute insights.",
      roles: ["Admin", "Product Manager", "Team Member"],
    },
    {
      title: "Customer Success",
      description:
        "Enable support teams to submit customer feedback without exposing internal discussions.",
      roles: ["Team Member", "Support Agent"],
    },
    {
      title: "Enterprise Organizations",
      description:
        "Manage complex permission structures across multiple departments and stakeholders.",
      roles: ["Admin", "Team Member", "Viewer", "External Stakeholder"],
    },
  ];

  const roleTypes = [
    {
      name: "Admin",
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      permissions: [
        "Full board management",
        "User and role management",
        "Billing and organization settings",
        "Delete and archive content",
        "Roadmap planning",
        "Changelog publishing",
      ],
    },
    {
      name: "Team Member",
      color:
        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      permissions: [
        "Create and edit posts",
        "Comment and vote",
        "Update post status",
        "View analytics",
        "Manage assigned feedback",
      ],
    },
    {
      name: "Viewer",
      color:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      permissions: [
        "View feedback boards",
        "Comment on posts",
        "Vote on features",
        "View roadmap",
        "Read changelog",
      ],
    },
  ];

  return (
    <>
      <div className="min-h-screen bg-white dark:bg-gray-900">
        {/* Hero Section */}
        <div className="pt-20 pb-16 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-6">
              <IconBrandTabler className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                Use Case
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-switzer font-medium mb-6 text-blue-600 dark:text-blue-400">
              Role-Based Access Control
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
              Secure your feedback management with flexible role-based
              permissions. Control who can view, edit, and manage feedback
              across your organization.
            </p>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push("/signup")}
                className="px-8 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-all hover:shadow-lg"
              >
                Get Started Free
              </button>
              <button
                onClick={() => router.push("/pricing")}
                className="px-8 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-full font-semibold border border-gray-300 dark:border-gray-700 hover:border-blue-600 dark:hover:border-blue-500 transition-all"
              >
                View Pricing
              </button>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="py-16 px-4 bg-white dark:bg-gray-900/50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">
              Powerful Permission Management
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-lg bg-white dark:bg-gray-900"
                >
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Role Types Section */}
        <div className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-4">
              Flexible Role Types
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Choose from predefined roles or customize permissions to fit your
              organization's needs
            </p>

            <div className="grid md:grid-cols-3 gap-5">
              {roleTypes.map((role, index) => (
                <div
                  key={index}
                  className="p-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-xl transition-all"
                >
                  <div
                    className={`inline-block px-4 py-2 rounded-full font-semibold mb-6 ${role.color}`}
                  >
                    {role.name}
                  </div>

                  <ul className="space-y-3">
                    {role.permissions.map((permission, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <IconShieldCheck className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {permission}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Use Cases Section */}
        <div className="py-16 px-4 bg-white dark:bg-gray-900/50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">
              Perfect For Any Team Structure
            </h2>

            <div className="grid md:grid-cols-3 gap-5">
              {useCases.map((useCase, index) => (
                <div
                  key={index}
                  className="p-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-lg transition-all"
                >
                  <h3 className="text-2xl font-bold mb-3">{useCase.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {useCase.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {useCase.roles.map((role, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="p-8 rounded-2xl bg-blue-600 text-white">
              <h2 className="text-2xl font-bold mb-4">
                Ready to secure your feedback workflow?
              </h2>
              <p className="text-xl mb-8 text-blue-100">
                Start managing permissions with role-based access control today
              </p>
              <button
                onClick={() => router.push("/signup")}
                className="px-8 py-4 bg-white text-blue-600 rounded-full font-semibold hover:shadow-2xl transition-all text-lg"
              >
                Get Started Free
              </button>
            </div>
          </div>
        </div>

        <LandingFooter />
      </div>
    </>
  );
}

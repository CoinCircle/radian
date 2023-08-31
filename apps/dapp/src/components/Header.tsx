"use client";
import { Fragment } from 'react'
import { Popover, Transition } from '@headlessui/react'
import Link from 'next/link'
import {
  ArrowPathIcon,
  Bars3Icon,
  BookmarkSquareIcon,
  CalendarIcon,
  ChartBarIcon,
  CursorArrowRaysIcon,
  LifebuoyIcon,
  PhoneIcon,
  PlayIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import ConnectWalletButton from './ConnectWalletButton';
import { useRouter, usePathname } from 'next/navigation';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

const links = [
  { label: 'Hyper', href: '/hyper' },
  { label: 'Swap', href: '/exchange' },
  { label: 'Pool', href: '#' },
  { label: 'Synths', href: '/synths' },
  { label: 'Lend/Borrow', href: '#' },
  { label: 'USDX', href: '#' },
  { label: 'Collector', href: '#' },
]


export default function Header() {
  const pathname = usePathname();
  return (
    <Popover className="relative bg-black">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-center justify-between border-gray-900 py-6 md:justify-start md:space-x-10">
          <div className="flex justify-start lg:w-0 lg:flex-1">
            <a href="#">
              <span className="sr-only">Your Company</span>
              <img
                className="h-8 w-auto sm:h-10"
                src="/logo.svg"
                alt=""
              />
            </a>
          </div>
          <div className="-my-2 -mr-2 md:hidden">
            <Popover.Button className="inline-flex items-center justify-center rounded-md bg-black p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
              <span className="sr-only">Open menu</span>
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </Popover.Button>
          </div>
          <Popover.Group as="nav" className="hidden space-x-10 md:flex items-center">
            {links.map((link) => (
              <Link key={link.label} href={link.href} className={classNames(
                "text-base font-medium",
                pathname === link.href ? "text-white" : "text-gray-500 hover:text-gray-400"
              )}>
                {link.label}
              </Link>
            ))}
            <div className="hidden md:block">
              <ConnectWalletButton />
            </div>
          </Popover.Group>
        </div>
      </div>

      <Transition
        as={Fragment}
        enter="duration-200 ease-out"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="duration-100 ease-in"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <Popover.Panel focus className="absolute inset-x-0 top-0 origin-top-right transform p-2 transition md:hidden z-10" >
          <div className="rounded-lg bg-black shadow-lg ring-1 ring-black ring-opacity-5">
            <div className="px-5 pt-5 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <img
                    className="h-8 w-auto"
                    src="/logo.svg"
                    alt="Your Company"
                  />
                </div>
                <div className="-mr-2">
                  <Popover.Button className="inline-flex items-center justify-center rounded-md bg-black p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
                    <span className="sr-only">Close menu</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </Popover.Button>
                </div>
              </div>
              <div className="mt-6">
                <nav className="grid gap-y-8">
                </nav>
              </div>
            </div>
            <div className="space-y-6 py-6 px-5">
              <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                {links.map((link) => (
                  <Link key={link.label} href={link.href} className={classNames(
                    "text-base font-medium",
                    pathname === link.href ? "text-white" : "text-gray-500 hover:text-gray-400"
                  )}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="space-y-6 my-6 text-center text-base font-medium text-gray-500">
              <ConnectWalletButton />
            </div>
          </div>
        </Popover.Panel>
      </Transition>
    </Popover>
  )
}

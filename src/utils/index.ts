import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { z } from 'zod'

export async function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve()
    }, ms)
  })
}

export const eqSet = <T>(xs: Set<T>, ys: Set<T>) =>
  xs.size === ys.size && [...xs].every((x) => ys.has(x))

export function isEmail(email: string) {
  return z.string().email().safeParse(email).success
}

type ReturnFile<T = boolean> = T extends true ? FileList : File

export async function browseFile(accept: string): Promise<File>
export async function browseFile<T extends boolean>(
  accept: string,
  isMultiple?: T
): Promise<ReturnFile<T>>
export async function browseFile<T extends boolean>(
  accept: string,
  isMultiple?: T
) {
  const input = document.createElement('input')
  input.setAttribute('type', 'file')
  input.setAttribute('accept', accept)
  if (isMultiple) {
    input.setAttribute('multiple', 'multiple')
  }
  input.style.display = 'none'
  document.body.appendChild(input)

  return new Promise((resolve, reject) => {
    input.addEventListener('change', function () {
      const { files } = input
      document.body.removeChild(input)
      if (files) {
        if (files[0]) {
          const returnFile = isMultiple ? files : files[0]
          resolve(returnFile as ReturnFile<T>)
        }
      }
    })

    input.addEventListener('error', function (event) {
      document.body.removeChild(input)
      reject(event)
    })

    input.click()
  })
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function navigate(href: string, target?: '_blank' | '_self') {
  const anchor = document.createElement('a')
  anchor.href = href
  if (target) {
    anchor.target = target
    if (target === '_blank') {
      anchor.rel = 'noopener noreferrer'
    }
  }
  anchor.style.display = 'fixed'
  anchor.style.zIndex = '0'
  anchor.style.top = '-1000px'
  anchor.style.left = '-1000px'
  anchor.style.visibility = 'hidden'

  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
}

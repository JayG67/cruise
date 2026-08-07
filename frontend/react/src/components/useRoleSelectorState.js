import { useEffect, useMemo, useState } from 'react'

import { normalizeRole } from '../domain/roleView.js'
import {
  buildPassengerOption,
  buildWorkspaceUserOption,
  condenseWorkspaceUserOptions,
  getOperationalAssignmentContext,
  getOperationalFilterOptions,
  getPassengerFilterOptions,
  isOperationalRole,
  passengerMatchesFilter,
  sortPassengerOptions
} from '../domain/roleSelectorOptions.js'

export default function useRoleSelectorState({
  bookings,
  filteredDemoUsers,
  selectedDemoUser,
  selectedDemoUserId,
  selectedRole,
  onSelectDemoUser,
  onSelectRole
}) {
  const [passengerSearch, setPassengerSearch] = useState('')
  const [passengerCruiseLineFilter, setPassengerCruiseLineFilter] = useState('')
  const [passengerShipFilter, setPassengerShipFilter] = useState('')
  const [passengerSailingDateFilter, setPassengerSailingDateFilter] = useState('')
  const [personSearch, setPersonSearch] = useState('')
  const [operationalCruiseLineFilter, setOperationalCruiseLineFilter] = useState('')
  const [operationalShipFilter, setOperationalShipFilter] = useState('')
  const [operationalFilterTouched, setOperationalFilterTouched] = useState(false)

  const isPassengerFilterActive = selectedRole === 'passenger'
  const selectedRoleView = normalizeRole(selectedRole)
  const isOperationalFilterActive = isOperationalRole(selectedRoleView)

  const passengerOptions = useMemo(() => {
    if (!isPassengerFilterActive) return []

    return sortPassengerOptions(filteredDemoUsers
      .filter(user => normalizeRole(user.role || user.userType) === 'passenger')
      .map(user => buildPassengerOption(user, bookings)))
  }, [bookings, filteredDemoUsers, isPassengerFilterActive])

  const visiblePassengerOptions = useMemo(() => {
    const search = passengerSearch.trim().toLowerCase()
    const hasActiveFinderCriteria = Boolean(
      search
      || passengerCruiseLineFilter
      || passengerShipFilter
      || passengerSailingDateFilter
    )

    if (!hasActiveFinderCriteria && bookings.length === 0) return []

    const matchingOptions = passengerOptions.filter(option => (
      (!search || option.searchText.includes(search))
      && passengerMatchesFilter(option, 'cruiseLine', passengerCruiseLineFilter)
      && passengerMatchesFilter(option, 'ship', passengerShipFilter)
      && passengerMatchesFilter(option, 'sailingDate', passengerSailingDateFilter)
    ))

    if (hasActiveFinderCriteria) return matchingOptions

    const contextBackedOptions = matchingOptions.filter(option => option.contexts.length > 0)
    return contextBackedOptions.length > 0 ? contextBackedOptions : matchingOptions
  }, [bookings.length, passengerCruiseLineFilter, passengerOptions, passengerSailingDateFilter, passengerSearch, passengerShipFilter])

  const visibleDemoUsers = useMemo(() => {
    if (!isPassengerFilterActive) return filteredDemoUsers

    const selectedPassenger = selectedDemoUserId
      ? passengerOptions.find(option => option.user.id === selectedDemoUserId)?.user
      : null
    const hasActiveFinderCriteria = Boolean(
      passengerSearch.trim()
      || passengerCruiseLineFilter
      || passengerShipFilter
      || passengerSailingDateFilter
    )
    const resultUsers = visiblePassengerOptions
      .slice(0, hasActiveFinderCriteria ? 50 : 12)
      .map(option => option.user)

    if (!hasActiveFinderCriteria && selectedPassenger && !resultUsers.some(user => user.id === selectedPassenger.id)) {
      return [selectedPassenger, ...resultUsers]
    }

    return resultUsers
  }, [filteredDemoUsers, isPassengerFilterActive, passengerCruiseLineFilter, passengerOptions, passengerSailingDateFilter, passengerSearch, passengerShipFilter, selectedDemoUserId, visiblePassengerOptions])

  const personSearchText = personSearch.trim().toLowerCase()
  const operationalSourceOptions = useMemo(() => {
    if (!isOperationalFilterActive) return []

    return filteredDemoUsers
      .filter(user => normalizeRole(user.role || user.userType) === selectedRoleView)
      .map(user => ({
        ...buildWorkspaceUserOption(user, bookings),
        assignment: getOperationalAssignmentContext(user)
      }))
  }, [bookings, filteredDemoUsers, isOperationalFilterActive, selectedRoleView])

  const operationalCruiseLineOptions = useMemo(
    () => getOperationalFilterOptions(operationalSourceOptions, 'cruiseLineName'),
    [operationalSourceOptions]
  )
  const operationalShipOptions = useMemo(() => {
    if (!operationalCruiseLineFilter) return []
    return getOperationalFilterOptions(
      operationalSourceOptions.filter(option => option.assignment?.cruiseLineName === operationalCruiseLineFilter),
      'shipName'
    )
  }, [operationalCruiseLineFilter, operationalSourceOptions])

  const personOptionCards = useMemo(() => {
    if (isOperationalFilterActive) {
      if (!operationalCruiseLineFilter) return []

      return operationalSourceOptions.filter(option => (
        (!personSearchText || (`${option.searchText} ${option.assignment?.searchText || ''}`).includes(personSearchText))
        && option.assignment?.cruiseLineName === operationalCruiseLineFilter
        && (!operationalShipFilter || option.assignment?.shipName === operationalShipFilter)
      ))
    }

    const sourceUsers = isPassengerFilterActive ? visibleDemoUsers : filteredDemoUsers
    const matchingOptions = sourceUsers
      .map(user => buildWorkspaceUserOption(user, bookings))
      .filter(option => !personSearchText || option.searchText.includes(personSearchText))

    return isPassengerFilterActive ? matchingOptions : condenseWorkspaceUserOptions(matchingOptions)
  }, [bookings, filteredDemoUsers, isOperationalFilterActive, isPassengerFilterActive, operationalCruiseLineFilter, operationalShipFilter, operationalSourceOptions, personSearchText, visibleDemoUsers])

  const displayedPersonOptionCards = useMemo(() => {
    const selectedOption = selectedDemoUserId
      ? personOptionCards.find(option => option.user.id === selectedDemoUserId)
      : null
    const visibleOptions = personOptionCards.slice(0, 16)

    if (selectedOption && !visibleOptions.some(option => option.user.id === selectedOption.user.id)) {
      return [selectedOption, ...visibleOptions.slice(0, 15)]
    }

    return visibleOptions
  }, [personOptionCards, selectedDemoUserId])

  const cruiseLineOptions = useMemo(() => getPassengerFilterOptions(passengerOptions, 'cruiseLine', {
    ship: passengerShipFilter,
    sailingDate: passengerSailingDateFilter
  }), [passengerOptions, passengerSailingDateFilter, passengerShipFilter])
  const shipOptions = useMemo(() => getPassengerFilterOptions(passengerOptions, 'ship', {
    cruiseLine: passengerCruiseLineFilter,
    sailingDate: passengerSailingDateFilter
  }), [passengerCruiseLineFilter, passengerOptions, passengerSailingDateFilter])
  const sailingDateOptions = useMemo(() => getPassengerFilterOptions(passengerOptions, 'sailingDate', {
    cruiseLine: passengerCruiseLineFilter,
    ship: passengerShipFilter
  }), [passengerCruiseLineFilter, passengerOptions, passengerShipFilter])

  useEffect(() => {
    if (!isOperationalFilterActive || operationalFilterTouched || operationalCruiseLineFilter) return

    const selectedAssignmentCruiseLine = getOperationalAssignmentContext(selectedDemoUser || {}).cruiseLineName
    if (selectedAssignmentCruiseLine && operationalCruiseLineOptions.includes(selectedAssignmentCruiseLine)) {
      setOperationalCruiseLineFilter(selectedAssignmentCruiseLine)
    }
  }, [isOperationalFilterActive, operationalCruiseLineFilter, operationalCruiseLineOptions, operationalFilterTouched, selectedDemoUser])

  useEffect(() => {
    if (operationalShipFilter && !operationalShipOptions.includes(operationalShipFilter)) {
      setOperationalShipFilter('')
    }
  }, [operationalShipFilter, operationalShipOptions])

  useEffect(() => {
    if (passengerCruiseLineFilter && !cruiseLineOptions.includes(passengerCruiseLineFilter)) {
      setPassengerCruiseLineFilter('')
    }
  }, [cruiseLineOptions, passengerCruiseLineFilter])

  useEffect(() => {
    if (passengerShipFilter && !shipOptions.includes(passengerShipFilter)) setPassengerShipFilter('')
  }, [passengerShipFilter, shipOptions])

  useEffect(() => {
    if (passengerSailingDateFilter && !sailingDateOptions.includes(passengerSailingDateFilter)) {
      setPassengerSailingDateFilter('')
    }
  }, [passengerSailingDateFilter, sailingDateOptions])

  useEffect(() => {
    if (personOptionCards.length === 0) return
    if (personOptionCards.some(option => option.user.id === selectedDemoUserId)) return
    onSelectDemoUser?.(personOptionCards[0].user.id)
  }, [onSelectDemoUser, personOptionCards, selectedDemoUserId])

  function handleRoleChange(role) {
    setPassengerSearch('')
    setPassengerCruiseLineFilter('')
    setPassengerShipFilter('')
    setPassengerSailingDateFilter('')
    setOperationalCruiseLineFilter('')
    setOperationalShipFilter('')
    setOperationalFilterTouched(false)
    setPersonSearch('')
    onSelectRole?.(role)
  }

  function handleOperationalCruiseLineChange(value) {
    setOperationalFilterTouched(true)
    setOperationalCruiseLineFilter(value)
    setOperationalShipFilter('')
  }

  return {
    cruiseLineOptions,
    displayedPersonOptionCards,
    handleOperationalCruiseLineChange,
    handleRoleChange,
    isOperationalFilterActive,
    isPassengerFilterActive,
    operationalCruiseLineFilter,
    operationalCruiseLineOptions,
    operationalShipFilter,
    operationalShipOptions,
    operationalSourceOptions,
    passengerCruiseLineFilter,
    passengerOptions,
    passengerSailingDateFilter,
    passengerSearch,
    passengerShipFilter,
    personOptionCards,
    personSearch,
    sailingDateOptions,
    setOperationalShipFilter,
    setPassengerCruiseLineFilter,
    setPassengerSailingDateFilter,
    setPassengerSearch,
    setPassengerShipFilter,
    setPersonSearch,
    shipOptions,
    visibleDemoUsers,
    visiblePassengerOptions
  }
}
